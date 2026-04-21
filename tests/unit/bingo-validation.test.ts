import { describe,expect,it } from "vitest";
import {
  CheckSubmissionValidity,
  parseDiscordMessageUrl,
} from "~/server/bingo/validation";

describe("bingo validation boundary", () => {
  it("parses a valid Discord message URL", () => {
    const parsed = parseDiscordMessageUrl(
      "https://discord.com/channels/123456789/987654321/111111111",
    );
    expect(parsed).toEqual({
      guildId: "123456789",
      channelId: "987654321",
      messageId: "111111111",
    });
  });

  it("rejects non-discord links", () => {
    const parsed = parseDiscordMessageUrl("https://example.com/test");
    expect(parsed).toBeNull();
  });

  it("returns false when board or tile is not claimable", () => {
    expect(
      CheckSubmissionValidity({
        boardTileId: "tile-1",
        discordMessageUrl:
          "https://discord.com/channels/123456789/987654321/111111111",
        boardIsActive: false,
      }),
    ).toBe(false);
    expect(
      CheckSubmissionValidity({
        boardTileId: "tile-1",
        discordMessageUrl:
          "https://discord.com/channels/123456789/987654321/111111111",
        tileCompletedAt: new Date(),
      }),
    ).toBe(false);
  });

  it("returns true for a valid claim input", () => {
    expect(
      CheckSubmissionValidity({
        boardTileId: "tile-1",
        discordMessageUrl:
          "https://discord.com/channels/123456789/987654321/111111111",
        boardIsActive: true,
        tileCompletedAt: null,
      }),
    ).toBe(true);
  });
});
