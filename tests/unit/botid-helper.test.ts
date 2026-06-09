import { beforeEach,describe,expect,it,vi } from "vitest";

const botIdServerMocks = vi.hoisted(() => ({
  checkBotId: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("botid/server", () => botIdServerMocks);

import { classifyBotTraffic } from "~/server/security/botid";

describe("BotID helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a bot classification when BotID flags the request", async () => {
    botIdServerMocks.checkBotId.mockResolvedValue({
      isBot: true,
      isHuman: false,
      isVerifiedBot: false,
      bypassed: false,
    });

    await expect(classifyBotTraffic()).resolves.toEqual({ isBot: true });
  });

  it("returns a human classification when BotID allows the request", async () => {
    botIdServerMocks.checkBotId.mockResolvedValue({
      isBot: false,
      isHuman: true,
      isVerifiedBot: false,
      bypassed: false,
    });

    await expect(classifyBotTraffic()).resolves.toEqual({ isBot: false });
  });

  it("fails open when BotID throws", async () => {
    botIdServerMocks.checkBotId.mockRejectedValue(new Error("botid unavailable"));

    await expect(classifyBotTraffic()).resolves.toEqual({ isBot: false });
  });
});
