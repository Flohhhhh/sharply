import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL ??=
  "postgres://postgres:postgres@localhost:5432/sharply";
process.env.PAYLOAD_SECRET ??= "test-payload-secret";
process.env.NEXT_PUBLIC_BASE_URL ??= "http://localhost:3000";

const authMocks = vi.hoisted(() => ({ getSessionOrThrow: vi.fn() }));
const dataMocks = vi.hoisted(() => ({
  getGearIdBySlug: vi.fn(),
  fetchGearLineageValidationRows: vi.fn(),
  setGearLineage: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/auth", () => ({ auth: {} }));
vi.mock("~/server/auth", () => authMocks);
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
vi.mock("~/server/gear/data", () => dataMocks);

import { updateGearLineage } from "~/server/gear/service";

const rows = (overrides: Record<string, unknown> = {}) =>
  [
    {
      id: "a",
      slug: "a",
      gearType: "CAMERA",
      predecessorGearId: null,
      successorGearId: null,
    },
    {
      id: "b",
      slug: "b",
      gearType: "CAMERA",
      predecessorGearId: null,
      successorGearId: null,
    },
    {
      id: "c",
      slug: "c",
      gearType: "CAMERA",
      predecessorGearId: null,
      successorGearId: null,
    },
  ].map((row) => ({ ...row, ...(overrides[row.id] as object) }));

describe("updateGearLineage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "editor", role: "EDITOR" },
    });
    dataMocks.getGearIdBySlug.mockResolvedValue("a");
    dataMocks.fetchGearLineageValidationRows.mockImplementation(
      async (ids: string[]) => rows().filter((row) => ids.includes(row.id)),
    );
    dataMocks.setGearLineage.mockResolvedValue(["a", "b", "c"]);
  });

  it("saves valid reciprocal lineage selections", async () => {
    const result = await updateGearLineage("a", {
      predecessorGearId: "b",
      successorGearId: "c",
    });
    expect(dataMocks.setGearLineage).toHaveBeenCalledWith({
      gearId: "a",
      predecessorGearId: "b",
      successorGearId: "c",
    });
    expect(result).toEqual({ ok: true, affectedSlugs: ["a", "b", "c"] });
  });

  it("surfaces validation errors from the locked data update", async () => {
    dataMocks.setGearLineage.mockRejectedValueOnce(
      new Error("A gear item cannot be its own predecessor or successor"),
    );
    await expect(
      updateGearLineage("a", { predecessorGearId: "a", successorGearId: null }),
    ).rejects.toThrow("own predecessor");
    dataMocks.setGearLineage.mockRejectedValueOnce(
      new Error("Predecessor and successor must be different gear items"),
    );
    await expect(
      updateGearLineage("a", { predecessorGearId: "b", successorGearId: "b" }),
    ).rejects.toThrow("must be different");
    dataMocks.setGearLineage.mockRejectedValueOnce(
      new Error("Predecessor and successor must have the same gear type"),
    );
    await expect(
      updateGearLineage("a", { predecessorGearId: "b", successorGearId: null }),
    ).rejects.toThrow("same gear type");
    dataMocks.setGearLineage.mockRejectedValueOnce(
      new Error("This relationship would create a lineage cycle"),
    );
    await expect(
      updateGearLineage("a", { predecessorGearId: null, successorGearId: "b" }),
    ).rejects.toThrow("lineage cycle");
  });

  it("rejects users without editor access", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "mod", role: "MODERATOR" },
    });
    await expect(
      updateGearLineage("a", {
        predecessorGearId: null,
        successorGearId: null,
      }),
    ).rejects.toMatchObject({ message: "Unauthorized", status: 401 });
    expect(dataMocks.setGearLineage).not.toHaveBeenCalled();
  });
});
