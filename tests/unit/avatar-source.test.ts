import { describe, expect, it } from "vitest";
import {
  getEffectiveAvatarSource,
  isDiscordAvatarUrl,
  resolveUserAvatar,
  shouldAdoptDiscordAvatarSource,
} from "~/lib/auth/avatar";

const discordUrl = "https://cdn.discordapp.com/avatars/123/hash.png";
const customUrl = "https://utfs.io/f/custom.png";

describe("avatar source resolution", () => {
  it("uses the synchronized Discord image for an explicit Discord source", () => {
    expect(
      resolveUserAvatar({
        image: customUrl,
        discordImage: discordUrl,
        avatarSource: "discord",
      }),
    ).toBe(discordUrl);
  });

  it("uses the custom image for an explicit custom source", () => {
    expect(
      resolveUserAvatar({
        image: customUrl,
        discordImage: discordUrl,
        avatarSource: "custom",
      }),
    ).toBe(customUrl);
  });

  it("falls back to the legacy image when a Discord image is missing", () => {
    expect(
      resolveUserAvatar({ image: discordUrl, avatarSource: "discord" }),
    ).toBe(discordUrl);
  });

  it("does not use a custom image when the Discord image is missing", () => {
    expect(
      resolveUserAvatar({ image: customUrl, avatarSource: "discord" }),
    ).toBeNull();
  });

  it("infers legacy Discord URLs without classifying other URLs as Discord", () => {
    expect(isDiscordAvatarUrl(discordUrl)).toBe(true);
    expect(
      isDiscordAvatarUrl("https://media.discordapp.net/avatars/1/a.png"),
    ).toBe(true);
    expect(isDiscordAvatarUrl(customUrl)).toBe(false);
    expect(isDiscordAvatarUrl("not a URL")).toBe(false);
    expect(getEffectiveAvatarSource({ image: discordUrl })).toBe("discord");
    expect(getEffectiveAvatarSource({ image: customUrl })).toBe("custom");
  });

  it("only upgrades legacy Discord users during synchronization", () => {
    expect(shouldAdoptDiscordAvatarSource({ image: discordUrl })).toBe(true);
    expect(
      shouldAdoptDiscordAvatarSource({
        image: customUrl,
        avatarSource: "custom",
      }),
    ).toBe(false);
    expect(
      shouldAdoptDiscordAvatarSource({
        image: discordUrl,
        avatarSource: "custom",
      }),
    ).toBe(false);
  });

  it("returns null when the selected source has no available image", () => {
    expect(resolveUserAvatar({ avatarSource: "custom" })).toBeNull();
    expect(resolveUserAvatar({ avatarSource: "discord" })).toBeNull();
  });
});
