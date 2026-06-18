import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL ??= "postgres://postgres:postgres@localhost:5432/sharply";
process.env.PAYLOAD_SECRET ??= "test-payload-secret";
process.env.NEXT_PUBLIC_BASE_URL ??= "http://localhost:3000";

const authMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const gearDataMocks = vi.hoisted(() => ({
  getGearIdBySlug: vi.fn(),
  updateGearInstructionManualLink: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({
  db: {},
}));
vi.mock("~/auth", () => ({
  auth: {},
}));
vi.mock("~/server/admin/proposals/service", () => ({
  applyTrustedContributorProposalApproval: vi.fn(),
  approveProposal: vi.fn(),
}));
vi.mock("~/server/admin/proposals/webhook", () => ({
  notifyAutoApprovedChangeRequest: vi.fn(),
  notifyChangeRequestModerators: vi.fn(),
}));
vi.mock("~/server/reviews/moderation/service", () => ({
  testReviewSafety: vi.fn(),
}));
vi.mock("~/server/reviews/summary/service", () => ({
  maybeGenerateReviewSummary: vi.fn(),
}));
vi.mock("~/server/auth", () => authMocks);
vi.mock("~/server/gear/data", () => gearDataMocks);

import { updateGearInstructionManualLink } from "~/server/gear/service";

describe("updateGearInstructionManualLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gearDataMocks.getGearIdBySlug.mockResolvedValue("gear-1");
    gearDataMocks.updateGearInstructionManualLink.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-zf",
      linkInstructionManual: "https://example.com/manual.pdf",
    });
  });

  it("lets editors save a valid instruction manual URL", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "editor-1", role: "EDITOR" },
    });

    const result = await updateGearInstructionManualLink("nikon-zf", {
      linkInstructionManual: " https://example.com/manual.pdf ",
    });

    expect(gearDataMocks.updateGearInstructionManualLink).toHaveBeenCalledWith({
      gearId: "gear-1",
      linkInstructionManual: "https://example.com/manual.pdf",
    });
    expect(result).toMatchObject({
      slug: "nikon-zf",
      linkInstructionManual: "https://example.com/manual.pdf",
    });
  });

  it("lets editors clear the instruction manual link with blank or null input", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "editor-1", role: "EDITOR" },
    });

    await updateGearInstructionManualLink("nikon-zf", {
      linkInstructionManual: "   ",
    });
    await updateGearInstructionManualLink("nikon-zf", {
      linkInstructionManual: null,
    });

    expect(gearDataMocks.updateGearInstructionManualLink).toHaveBeenNthCalledWith(
      1,
      {
        gearId: "gear-1",
        linkInstructionManual: null,
      },
    );
    expect(gearDataMocks.updateGearInstructionManualLink).toHaveBeenNthCalledWith(
      2,
      {
        gearId: "gear-1",
        linkInstructionManual: null,
      },
    );
  });

  it("rejects moderators who do not have editor access", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "mod-1", role: "MODERATOR" },
    });

    await expect(
      updateGearInstructionManualLink("nikon-zf", {
        linkInstructionManual: "https://example.com/manual.pdf",
      }),
    ).rejects.toMatchObject({ message: "Unauthorized", status: 401 });

    expect(gearDataMocks.updateGearInstructionManualLink).not.toHaveBeenCalled();
  });

  it("rejects signed-out users", async () => {
    authMocks.getSessionOrThrow.mockRejectedValue(
      Object.assign(new Error("Unauthorized"), { status: 401 }),
    );

    await expect(
      updateGearInstructionManualLink("nikon-zf", {
        linkInstructionManual: "https://example.com/manual.pdf",
      }),
    ).rejects.toMatchObject({ message: "Unauthorized", status: 401 });

    expect(gearDataMocks.updateGearInstructionManualLink).not.toHaveBeenCalled();
  });
});
