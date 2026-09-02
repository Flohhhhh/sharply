import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  unlinkAccount: vi.fn(),
  updateUser: vi.fn(),
  getAccessToken: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));
vi.mock("~/auth", () => ({
  auth: { api: authMocks },
}));
const dataMocks = vi.hoisted(() => ({
  updateUserAvatarData: vi.fn(),
  syncDiscordAvatarForUser: vi.fn(),
}));
vi.mock("~/server/users/data", () => dataMocks);

import {
  disconnectLinkedAccount,
  syncCurrentDiscordAvatar,
} from "~/server/auth/account-linking";

describe("Discord avatar behavior during account unlinking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.unlinkAccount.mockResolvedValue({ status: true });
    authMocks.updateUser.mockResolvedValue({ status: true });
  });

  it("falls back to custom when the disconnected account supplies the avatar", async () => {
    authMocks.getSession.mockResolvedValue({
      user: { id: "user-1", avatarSource: "discord" },
    });

    await expect(
      disconnectLinkedAccount("discord", "discord-1"),
    ).resolves.toEqual({ ok: true });

    expect(authMocks.unlinkAccount).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      body: { providerId: "discord", accountId: "discord-1" },
    });
    expect(dataMocks.updateUserAvatarData).toHaveBeenCalledWith("user-1", {
      avatarSource: "custom",
    });
  });

  it("always falls back for Discord but does not change Google", async () => {
    authMocks.getSession.mockResolvedValue({
      user: { id: "user-1", avatarSource: "custom" },
    });

    await disconnectLinkedAccount("discord", "discord-1");
    expect(dataMocks.updateUserAvatarData).toHaveBeenCalledWith("user-1", {
      avatarSource: "custom",
    });
    dataMocks.updateUserAvatarData.mockClear();
    await disconnectLinkedAccount("google", "google-1");

    expect(dataMocks.updateUserAvatarData).not.toHaveBeenCalled();
  });

  it("falls back for a legacy Discord URL with no explicit source", async () => {
    authMocks.getSession.mockResolvedValue({
      user: {
        id: "user-1",
        image: "https://cdn.discordapp.com/avatars/1/legacy.png",
        avatarSource: null,
      },
    });

    await disconnectLinkedAccount("discord", "discord-1");

    expect(dataMocks.updateUserAvatarData).toHaveBeenCalledWith("user-1", {
      avatarSource: "custom",
    });
  });

  it("synchronizes Discord immediately after linking", async () => {
    authMocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    authMocks.getAccessToken.mockResolvedValue({ accessToken: "token" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ id: "123", avatar: "a_hash", discriminator: "0" }),
      ),
    );

    await expect(syncCurrentDiscordAvatar()).resolves.toEqual({
      ok: true,
      discordImage: "https://cdn.discordapp.com/avatars/123/a_hash.gif",
    });
    expect(dataMocks.syncDiscordAvatarForUser).toHaveBeenCalledWith(
      "user-1",
      "https://cdn.discordapp.com/avatars/123/a_hash.gif",
    );
  });
});
