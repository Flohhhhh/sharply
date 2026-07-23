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
  updateOwnedGearColorway: vi.fn(),
  updateGearAlternatives: vi.fn(),
  updateGearLineage: vi.fn(),
  updateGearInstructionManualLink: vi.fn(),
  upsertStaffVerdict: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => cacheMocks);
vi.mock("~/server/security/botid", () => ({
  classifyBotTraffic: vi.fn(),
}));
vi.mock("~/server/gear/service", () => gearServiceMocks);

import {
  actionUpdateGearInstructionManualLink,
  actionUpdateGearLineage,
} from "~/server/gear/actions";

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
    expect(
      gearServiceMocks.updateGearInstructionManualLink,
    ).toHaveBeenCalledWith("nikon-zf", {
      linkInstructionManual: "https://example.com/manual.pdf",
    });
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/gear/nikon-zf");
  });
});

describe("actionUpdateGearLineage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates every gear changed by reciprocal synchronization", async () => {
    gearServiceMocks.updateGearLineage.mockResolvedValue({
      ok: true,
      affectedSlugs: ["canon-r5", "canon-r5-ii"],
    });

    await actionUpdateGearLineage("canon-r5", {
      predecessorGearId: null,
      successorGearId: "gear-r5-ii",
    });

    expect(gearServiceMocks.updateGearLineage).toHaveBeenCalledWith(
      "canon-r5",
      {
        predecessorGearId: null,
        successorGearId: "gear-r5-ii",
      },
    );
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/gear/canon-r5");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/gear/canon-r5-ii");
  });
});
