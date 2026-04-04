import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const serviceMocks = vi.hoisted(() => ({
  approveProposal: vi.fn(),
  mergeProposal: vi.fn(),
  rejectProposal: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);
vi.mock("server-only", () => ({}));
vi.mock("~/server/admin/proposals/service", () => serviceMocks);

import {
  actionApproveProposal,
  actionMergeProposal,
  actionRejectProposal,
} from "~/server/admin/proposals/actions";

describe("admin proposal actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.approveProposal.mockResolvedValue(undefined);
    serviceMocks.mergeProposal.mockResolvedValue(undefined);
    serviceMocks.rejectProposal.mockResolvedValue(undefined);
  });

  it("revalidates gear-facing pages after approval", async () => {
    await actionApproveProposal(
      "proposal-1",
      { analogCamera: { cameraType: "slr" } },
      {
        gearName: "Nikon FM2",
        gearSlug: "nikon-fm2",
      },
    );

    expect(serviceMocks.approveProposal).toHaveBeenCalledWith(
      "proposal-1",
      { analogCamera: { cameraType: "slr" } },
      {
        gearName: "Nikon FM2",
        gearSlug: "nikon-fm2",
      },
    );
    expect(cacheMocks.revalidatePath).toHaveBeenCalledTimes(3);
    expect(cacheMocks.revalidatePath).toHaveBeenNthCalledWith(1, "/admin");
    expect(cacheMocks.revalidatePath).toHaveBeenNthCalledWith(
      2,
      "/lists/under-construction",
    );
    expect(cacheMocks.revalidatePath).toHaveBeenNthCalledWith(
      3,
      "/gear/nikon-fm2",
    );
  });

  it("keeps merge and reject revalidation scoped to admin", async () => {
    await actionMergeProposal("proposal-1");
    await actionRejectProposal("proposal-2");

    expect(serviceMocks.mergeProposal).toHaveBeenCalledWith("proposal-1");
    expect(serviceMocks.rejectProposal).toHaveBeenCalledWith("proposal-2");
    expect(cacheMocks.revalidatePath).toHaveBeenNthCalledWith(1, "/admin");
    expect(cacheMocks.revalidatePath).toHaveBeenNthCalledWith(2, "/admin");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledTimes(2);
  });
});
