import { beforeEach, describe, expect, it, vi } from "vitest";

const dataMocks = vi.hoisted(() => ({
  syncDiscordAvatarData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/users/data", () => dataMocks);

import {
  getDiscordAvatarUrl,
  getInitialDiscordAvatarData,
  mapDiscordProfileToUser,
} from "~/server/auth/discord-profile";

describe("Discord OAuth profile mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("synchronizes and maps the current Discord avatar", async () => {
    const imageUrl = "https://cdn.discordapp.com/avatars/123/new.png";

    await expect(
      mapDiscordProfileToUser({ id: "123", image_url: imageUrl }),
    ).resolves.toEqual({
      discordImage: imageUrl,
      avatarSource: "discord",
    });
    expect(dataMocks.syncDiscordAvatarData).toHaveBeenCalledWith(
      "123",
      imageUrl,
    );
  });

  it("does not attempt a synchronization without an avatar URL", async () => {
    await expect(
      mapDiscordProfileToUser({ id: "123", image_url: null }),
    ).resolves.toEqual({ discordImage: null, avatarSource: "discord" });
    expect(dataMocks.syncDiscordAvatarData).not.toHaveBeenCalled();
  });
});

describe("Discord avatar initialization", () => {
  it("initializes server-owned fields only for Discord-hosted images", () => {
    const image = "https://cdn.discordapp.com/avatars/123/new.png";
    expect(getInitialDiscordAvatarData(image)).toEqual({
      discordImage: image,
      avatarSource: "discord",
    });
    expect(
      getInitialDiscordAvatarData("https://example.com/avatar.png"),
    ).toBeNull();
  });

  it("builds custom and default Discord avatar URLs", () => {
    expect(
      getDiscordAvatarUrl({ id: "123", avatar: "a_hash", discriminator: "0" }),
    ).toBe("https://cdn.discordapp.com/avatars/123/a_hash.gif");
    expect(
      getDiscordAvatarUrl({ id: "0", avatar: null, discriminator: "2" }),
    ).toBe("https://cdn.discordapp.com/embed/avatars/2.png");
  });
});
