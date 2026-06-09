import { beforeEach,describe,expect,it,vi } from "vitest";

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
};

const headerStore = new Headers({
  "user-agent": "Mozilla/5.0",
});

const nextHeaderMocks = vi.hoisted(() => ({
  cookies: vi.fn(async () => cookieStore),
  headers: vi.fn(async () => headerStore),
}));

const botIdMocks = vi.hoisted(() => ({
  classifyBotTraffic: vi.fn(),
}));

const popularityServiceMocks = vi.hoisted(() => ({
  incrementComparePairCount: vi.fn(),
  recordCompareAdd: vi.fn(),
  recordGearView: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => nextHeaderMocks);
vi.mock("~/server/security/botid", () => botIdMocks);
vi.mock("~/server/popularity/service", () => popularityServiceMocks);

import { actionRecordGearView } from "~/server/popularity/actions";

describe("popularity actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
    botIdMocks.classifyBotTraffic.mockResolvedValue({ isBot: false });
  });

  it("returns skipped botid and avoids writes when BotID blocks the visit", async () => {
    botIdMocks.classifyBotTraffic.mockResolvedValue({ isBot: true });

    const result = await actionRecordGearView({ slug: "nikon-zf" });

    expect(result).toEqual({
      success: true,
      deduped: false,
      skipped: "botid",
    });
    expect(nextHeaderMocks.cookies).not.toHaveBeenCalled();
    expect(nextHeaderMocks.headers).not.toHaveBeenCalled();
    expect(popularityServiceMocks.recordGearView).not.toHaveBeenCalled();
  });
});
