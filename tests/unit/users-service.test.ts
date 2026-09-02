import { beforeEach, describe, expect, it, vi } from "vitest";

const authHelperMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const betterAuthMocks = vi.hoisted(() => ({
  auth: {
    api: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

const headerMocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

const accountLinkingMocks = vi.hoisted(() => ({
  fetchLinkedAccountsForUser: vi.fn(),
}));

const dbState = vi.hoisted(() => ({
  selectResults: [] as unknown[],
}));

const dbMocks = vi.hoisted(() => ({
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(async () => dbState.selectResults.shift() ?? []),
      })),
    })),
  })),
}));

const schemaMocks = vi.hoisted(() => ({
  brands: {},
  fixedLensSpecs: {},
  gear: {},
  gearMounts: {},
  lensSpecs: {},
  mounts: {},
  notifications: {
    id: "id",
    userId: "userId",
    sourceId: "sourceId",
  },
  ownerships: {},
  reviews: {},
  users: {
    id: "id",
    email: "email",
    emailVerified: "emailVerified",
    handle: "handle",
    image: "image",
    discordImage: "discordImage",
    avatarSource: "avatarSource",
    memberNumber: "memberNumber",
    name: "name",
  },
  wishlists: {},
}));

const dataMocks = vi.hoisted(() => ({
  updateUserSocialLinks: vi.fn(),
  updateUserAvatarData: vi.fn(),
}));

const notificationDataMocks = vi.hoisted(() => ({
  createNotificationData: vi.fn(),
}));

const gearDataMocks = vi.hoisted(() => ({
  fetchGearAliasesByGearIds: vi.fn(),
}));

vi.mock("~/server/auth", () => authHelperMocks);
vi.mock("~/server/auth/account-linking", () => accountLinkingMocks);
vi.mock("~/auth", () => betterAuthMocks);
vi.mock("next/headers", () => headerMocks);
vi.mock("~/server/db", () => ({ db: dbMocks }));
vi.mock("~/server/db/schema", () => schemaMocks);
vi.mock("~/server/users/data", () => dataMocks);
vi.mock("~/server/notifications/data", () => notificationDataMocks);
vi.mock("~/server/gear/data", () => gearDataMocks);
vi.mock("server-only", () => ({}));
vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args) => ({ args, type: "and" })),
  eq: vi.fn((left, right) => ({ left, right, type: "eq" })),
  sql: Object.assign(
    vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
      type: "sql",
    })),
    {
      join: vi.fn((values: unknown[], separator: unknown) => ({
        separator,
        type: "sql.join",
        values,
      })),
    },
  ),
}));

import {
  clearProfileImage,
  updateAvatarSource,
  updateProfileImage,
  updateUserHandle,
} from "~/server/users/service";

describe("users service handle updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.selectResults = [];
    authHelperMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1" },
    });
    betterAuthMocks.auth.api.updateUser.mockResolvedValue({ status: true });
    headerMocks.headers.mockResolvedValue(new Headers());
  });

  it("updates the auth user when the requested handle is available", async () => {
    dbState.selectResults.push([]);

    await expect(updateUserHandle("new-handle")).resolves.toEqual({
      ok: true,
      handle: "new-handle",
    });

    expect(betterAuthMocks.auth.api.updateUser).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      body: { handle: "new-handle" },
    });
  });

  it("rejects taken handles before attempting the auth update", async () => {
    dbState.selectResults.push([{ id: "another-user" }]);

    await expect(updateUserHandle("taken-handle")).rejects.toThrow(
      "Handle is already taken",
    );

    expect(betterAuthMocks.auth.api.updateUser).not.toHaveBeenCalled();
  });

  it("rejects reserved handles before querying availability", async () => {
    await expect(updateUserHandle("admin")).rejects.toThrow(
      "This handle is reserved",
    );

    expect(dbMocks.select).not.toHaveBeenCalled();
    expect(betterAuthMocks.auth.api.updateUser).not.toHaveBeenCalled();
  });

  it("rejects invalid handles before querying availability", async () => {
    await expect(updateUserHandle("bad handle")).rejects.toThrow(
      "Handle can only contain letters, numbers, hyphens, and underscores",
    );

    expect(dbMocks.select).not.toHaveBeenCalled();
    expect(betterAuthMocks.auth.api.updateUser).not.toHaveBeenCalled();
  });

  it("stores uploads as the custom avatar without overwriting Discord", async () => {
    dbState.selectResults.push([
      {
        id: "user-1",
        image: "https://utfs.io/f/old.png",
        discordImage: "https://cdn.discordapp.com/avatars/1/old.png",
        avatarSource: "discord",
      },
    ]);

    await expect(
      updateProfileImage("https://utfs.io/f/new.png"),
    ).resolves.toEqual({
      ok: true,
      imageUrl: "https://utfs.io/f/new.png",
      avatarSource: "custom",
      oldImageUrl: "https://utfs.io/f/old.png",
    });

    expect(dataMocks.updateUserAvatarData).toHaveBeenCalledWith("user-1", {
      image: "https://utfs.io/f/new.png",
      avatarSource: "custom",
    });
  });

  it("clears only the custom avatar and keeps the custom source selected", async () => {
    dbState.selectResults.push([
      {
        id: "user-1",
        image: "https://utfs.io/f/custom.png",
        discordImage: "https://cdn.discordapp.com/avatars/1/current.png",
        avatarSource: "custom",
      },
    ]);

    await expect(clearProfileImage()).resolves.toEqual({
      ok: true,
      imageUrl: null,
      avatarSource: "custom",
      oldImageUrl: "https://utfs.io/f/custom.png",
    });

    expect(dataMocks.updateUserAvatarData).toHaveBeenCalledWith("user-1", {
      image: null,
      avatarSource: "custom",
    });
  });

  it("selects a synchronized avatar for a linked Discord account", async () => {
    const discordImage = "https://cdn.discordapp.com/avatars/1/new.png";
    dbState.selectResults.push([
      {
        id: "user-1",
        image: "https://utfs.io/f/custom.png",
        discordImage,
        avatarSource: "custom",
      },
    ]);
    accountLinkingMocks.fetchLinkedAccountsForUser.mockResolvedValue({
      discord: { provider: "discord", providerAccountId: "discord-1" },
      google: null,
    });

    await expect(updateAvatarSource("discord")).resolves.toEqual({
      ok: true,
      avatarSource: "discord",
      imageUrl: discordImage,
    });

    expect(dataMocks.updateUserAvatarData).toHaveBeenCalledWith("user-1", {
      avatarSource: "discord",
    });
  });

  it("rejects Discord selection without a linked synchronized avatar", async () => {
    dbState.selectResults.push([
      {
        id: "user-1",
        image: null,
        discordImage: null,
        avatarSource: "custom",
      },
    ]);
    accountLinkingMocks.fetchLinkedAccountsForUser.mockResolvedValue({
      discord: null,
      google: null,
    });

    await expect(updateAvatarSource("discord")).rejects.toThrow(
      "A linked Discord account with a synced avatar is required",
    );
    expect(betterAuthMocks.auth.api.updateUser).not.toHaveBeenCalled();
  });
});
