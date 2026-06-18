import { beforeEach,describe,expect,it,vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const botIdMocks = vi.hoisted(() => ({
  classifyBotTraffic: vi.fn(),
}));

const gearServiceMocks = vi.hoisted(() => ({
  addRawSampleToGear: vi.fn(),
  removeRawSampleFromGear: vi.fn(),
  submitGearEditProposal: vi.fn(),
  submitReview: vi.fn(),
  toggleImageRequest: vi.fn(),
  toggleOwnership: vi.fn(),
  toggleWishlist: vi.fn(),
  updateGearAlternatives: vi.fn(),
  updateGearInstructionManualLink: vi.fn(),
  upsertStaffVerdict: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => cacheMocks);
vi.mock("~/server/security/botid", () => botIdMocks);
vi.mock("~/server/gear/service", () => gearServiceMocks);

import { actionSubmitGearProposal } from "~/server/gear/actions";

describe("gear actions BotID guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    botIdMocks.classifyBotTraffic.mockResolvedValue({ isBot: false });
  });

  it("stops gear proposals before persistence when BotID blocks the request", async () => {
    botIdMocks.classifyBotTraffic.mockResolvedValue({ isBot: true });

    await expect(
      actionSubmitGearProposal({
        slug: "nikon-zf",
        payload: { core: { name: "Updated" } },
      }),
    ).rejects.toMatchObject({
      message: "Access denied.",
      code: "REVIEW_BOT_BLOCKED",
      status: 403,
    });

    expect(gearServiceMocks.submitGearEditProposal).not.toHaveBeenCalled();
    expect(cacheMocks.revalidatePath).not.toHaveBeenCalled();
  });
});
