import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidationMocks = vi.hoisted(() => ({
  revalidateGearPages: vi.fn(),
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
vi.mock("~/server/security/botid", () => ({
  classifyBotTraffic: vi.fn(),
}));
vi.mock("~/server/gear/service", () => gearServiceMocks);
vi.mock("~/server/revalidation", () => revalidationMocks);

import {
  actionToggleImageRequest,
  actionToggleOwnership,
  actionToggleWishlist,
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
    expect(revalidationMocks.revalidateGearPages).toHaveBeenCalledWith([
      "nikon-zf",
    ]);
  });
});

describe("personalized gear actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not invalidate the shared gear page for wishlist changes", async () => {
    gearServiceMocks.toggleWishlist.mockResolvedValue({
      ok: true,
      action: "added",
    });

    await actionToggleWishlist("nikon-zf", "add");

    expect(revalidationMocks.revalidateGearPages).not.toHaveBeenCalled();
  });

  it("does not invalidate the shared gear page for ownership changes", async () => {
    gearServiceMocks.toggleOwnership.mockResolvedValue({
      ok: true,
      action: "added",
    });

    await actionToggleOwnership("nikon-zf", "add");

    expect(revalidationMocks.revalidateGearPages).not.toHaveBeenCalled();
  });

  it("does not invalidate the shared gear page for image requests", async () => {
    gearServiceMocks.toggleImageRequest.mockResolvedValue({
      ok: true,
      action: "added",
    });

    await actionToggleImageRequest("nikon-zf", "add");

    expect(revalidationMocks.revalidateGearPages).not.toHaveBeenCalled();
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
    expect(revalidationMocks.revalidateGearPages).toHaveBeenCalledWith([
      "canon-r5",
      "canon-r5",
      "canon-r5-ii",
    ]);
  });
});
