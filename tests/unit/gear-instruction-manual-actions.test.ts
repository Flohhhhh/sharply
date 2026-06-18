import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
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
vi.mock("~/server/security/botid", () => ({
  classifyBotTraffic: vi.fn(),
}));
vi.mock("~/server/gear/service", () => gearServiceMocks);

import { actionUpdateGearInstructionManualLink } from "~/server/gear/actions";

describe("actionUpdateGearInstructionManualLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates the gear page after updating the instruction manual link", async () => {
    gearServiceMocks.updateGearInstructionManualLink.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-zf",
      linkInstructionManual: "https://example.com/manual.pdf",
    });

    const result = await actionUpdateGearInstructionManualLink("nikon-zf", {
      linkInstructionManual: "https://example.com/manual.pdf",
    });

    expect(result).toMatchObject({
      linkInstructionManual: "https://example.com/manual.pdf",
    });
    expect(gearServiceMocks.updateGearInstructionManualLink).toHaveBeenCalledWith(
      "nikon-zf",
      {
        linkInstructionManual: "https://example.com/manual.pdf",
      },
    );
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/gear/nikon-zf");
  });
});
