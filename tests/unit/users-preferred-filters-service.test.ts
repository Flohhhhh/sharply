import { beforeEach, describe, expect, it, vi } from "vitest";

const authHelperMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const betterAuthMocks = vi.hoisted(() => ({
  auth: {
    api: {
      updateUser: vi.fn(),
    },
  },
}));

const headerMocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

const dataMocks = vi.hoisted(() => ({
  fetchMountPreferenceOption: vi.fn(),
  updateUserPreferredFilters: vi.fn(),
  updateUserSocialLinks: vi.fn(),
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
    createdAt: "createdAt",
    id: "id",
  },
  wishlists: {},
}));

vi.mock("~/server/auth", () => authHelperMocks);
vi.mock("~/auth", () => betterAuthMocks);
vi.mock("next/headers", () => headerMocks);
vi.mock("~/server/users/data", () => dataMocks);
vi.mock("~/server/db/schema", () => schemaMocks);
vi.mock("~/server/db", () => ({
  db: {},
}));
vi.mock("~/server/notifications/data", () => ({
  createNotificationData: vi.fn(),
}));
vi.mock("~/server/gear/data", () => ({
  fetchGearAliasesByGearIds: vi.fn(),
  fetchGearColorwaysByGearIds: vi.fn(),
}));
vi.mock("~/lib/mapping/mounts-map", () => ({
  getMountById: vi.fn(),
}));
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

import { updatePreferredFilters } from "~/server/users/service";

describe("users service preferred filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authHelperMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1" },
    });
    headerMocks.headers.mockResolvedValue(new Headers());
    betterAuthMocks.auth.api.updateUser.mockResolvedValue({ status: true });
    dataMocks.fetchMountPreferenceOption.mockResolvedValue(null);
    dataMocks.updateUserPreferredFilters.mockResolvedValue(undefined);
  });

  it("saves a preferred brand without a mount", async () => {
    await expect(
      updatePreferredFilters({
        preferredBrandId: "brand-1",
        preferredMountId: null,
      }),
    ).resolves.toEqual({
      ok: true,
      preferredBrandId: "brand-1",
      preferredMountId: null,
    });

    expect(dataMocks.updateUserPreferredFilters).toHaveBeenCalledWith("user-1", {
      preferredBrandId: "brand-1",
      preferredMountId: null,
    });
    expect(betterAuthMocks.auth.api.updateUser).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      body: {
        preferredBrandId: "brand-1",
        preferredMountId: null,
      },
    });
  });

  it("saves a preferred brand and matching mount", async () => {
    dataMocks.fetchMountPreferenceOption.mockResolvedValue({
      id: "mount-1",
      brandId: "brand-1",
    });

    await expect(
      updatePreferredFilters({
        preferredBrandId: "brand-1",
        preferredMountId: "mount-1",
      }),
    ).resolves.toEqual({
      ok: true,
      preferredBrandId: "brand-1",
      preferredMountId: "mount-1",
    });
  });

  it("rejects a preferred mount when no preferred brand is set", async () => {
    await expect(
      updatePreferredFilters({
        preferredBrandId: null,
        preferredMountId: "mount-1",
      }),
    ).rejects.toThrow("Preferred mount requires a preferred brand");

    expect(dataMocks.updateUserPreferredFilters).not.toHaveBeenCalled();
    expect(betterAuthMocks.auth.api.updateUser).not.toHaveBeenCalled();
  });

  it("rejects a preferred mount from a different brand", async () => {
    dataMocks.fetchMountPreferenceOption.mockResolvedValue({
      id: "mount-1",
      brandId: "brand-2",
    });

    await expect(
      updatePreferredFilters({
        preferredBrandId: "brand-1",
        preferredMountId: "mount-1",
      }),
    ).rejects.toThrow("Preferred mount must belong to the selected brand");

    expect(dataMocks.updateUserPreferredFilters).not.toHaveBeenCalled();
  });

  it("clears the preferred mount when the preferred brand is cleared", async () => {
    await expect(
      updatePreferredFilters({
        preferredBrandId: null,
        preferredMountId: null,
      }),
    ).resolves.toEqual({
      ok: true,
      preferredBrandId: null,
      preferredMountId: null,
    });

    expect(dataMocks.updateUserPreferredFilters).toHaveBeenCalledWith("user-1", {
      preferredBrandId: null,
      preferredMountId: null,
    });
  });
});
