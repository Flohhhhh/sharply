import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const gearDataMocks = vi.hoisted(() => ({
  createGearEditProposal: vi.fn(),
  fetchGearMetadataById: vi.fn(),
  getGearIdBySlug: vi.fn(),
  hasPendingEditsForGear: vi.fn(),
  insertAuditLog: vi.fn(),
}));

const proposalServiceMocks = vi.hoisted(() => ({
  approveProposal: vi.fn(),
}));

const webhookMocks = vi.hoisted(() => ({
  notifyChangeRequestModerators: vi.fn(),
}));

const analyticsMocks = vi.hoisted(() => ({
  track: vi.fn(),
}));

const normalizerMocks = vi.hoisted(() => ({
  normalizeProposalPayloadForDb: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));
vi.mock("~/server/auth", () => authMocks);
vi.mock("@vercel/analytics/server", () => analyticsMocks);
vi.mock("~/server/db/normalizers", () => normalizerMocks);
vi.mock("~/server/admin/proposals/service", () => proposalServiceMocks);
vi.mock("~/server/admin/proposals/webhook", () => webhookMocks);
vi.mock("~/server/badges/service", () => ({
  evaluateForEvent: vi.fn(),
}));
vi.mock("~/server/reviews/moderation/service", () => ({
  testReviewSafety: vi.fn(),
}));
vi.mock("~/server/reviews/summary/service", () => ({
  maybeGenerateReviewSummary: vi.fn(),
}));
vi.mock("~/server/gear/home-activity", () => ({
  mapGearRowsToHomeActivityItems: vi.fn(),
}));
vi.mock("~/server/gear/data", () => gearDataMocks);

import { submitGearEditProposal } from "~/server/gear/service";

function makeProposal(overrides: Record<string, unknown> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    gearId: "22222222-2222-4222-8222-222222222222",
    createdById: "user-1",
    payload: { core: { name: "Updated name" } },
    note: null,
    status: "PENDING" as const,
    ...overrides,
  };
}

describe("gear edit submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1", role: "EDITOR" },
    });

    normalizerMocks.normalizeProposalPayloadForDb.mockImplementation(
      (payload) => payload,
    );

    gearDataMocks.hasPendingEditsForGear.mockResolvedValue(false);
    gearDataMocks.fetchGearMetadataById.mockResolvedValue({
      gearType: "CAMERA",
      name: "Nikon Zf",
      slug: "nikon-zf",
    });
    gearDataMocks.createGearEditProposal.mockResolvedValue(makeProposal());
    gearDataMocks.insertAuditLog.mockResolvedValue(undefined);

    proposalServiceMocks.approveProposal.mockResolvedValue(undefined);
    webhookMocks.notifyChangeRequestModerators.mockResolvedValue(undefined);
    analyticsMocks.track.mockResolvedValue(undefined);
  });

  it("auto-approves eligible users when autoSubmit is omitted", async () => {
    const result = await submitGearEditProposal({
      gearId: "22222222-2222-4222-8222-222222222222",
      payload: { core: { name: "Updated name" } },
    });

    expect(result.autoApproved).toBe(true);
    expect(result.proposal.status).toBe("APPROVED");
    expect(proposalServiceMocks.approveProposal).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      { core: { name: "Updated name" } },
      {
        gearName: "Nikon Zf",
        gearSlug: "nikon-zf",
      },
    );
    expect(webhookMocks.notifyChangeRequestModerators).not.toHaveBeenCalled();
  });

  it("keeps eligible users in review when autoSubmit is disabled", async () => {
    const result = await submitGearEditProposal({
      gearId: "22222222-2222-4222-8222-222222222222",
      payload: { core: { name: "Updated name" } },
      autoSubmit: false,
    });

    expect(result.autoApproved).toBe(false);
    expect(result.proposal.status).toBe("PENDING");
    expect(proposalServiceMocks.approveProposal).not.toHaveBeenCalled();
    expect(webhookMocks.notifyChangeRequestModerators).toHaveBeenCalledWith({
      proposalId: "11111111-1111-4111-8111-111111111111",
      gearId: "22222222-2222-4222-8222-222222222222",
      gearType: "CAMERA",
      gearName: "Nikon Zf",
      gearSlug: "nikon-zf",
    });
  });

  it("ignores autoSubmit for ineligible users", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const result = await submitGearEditProposal({
      gearId: "22222222-2222-4222-8222-222222222222",
      payload: { core: { name: "Updated name" } },
      autoSubmit: true,
    });

    expect(result.autoApproved).toBe(false);
    expect(result.proposal.status).toBe("PENDING");
    expect(proposalServiceMocks.approveProposal).not.toHaveBeenCalled();
    expect(webhookMocks.notifyChangeRequestModerators).toHaveBeenCalledTimes(1);
  });

  it("does not auto-approve when a pending edit already exists", async () => {
    gearDataMocks.hasPendingEditsForGear.mockResolvedValue(true);

    const result = await submitGearEditProposal({
      gearId: "22222222-2222-4222-8222-222222222222",
      payload: { core: { name: "Updated name" } },
      autoSubmit: true,
    });

    expect(result.autoApproved).toBe(false);
    expect(result.proposal.status).toBe("PENDING");
    expect(proposalServiceMocks.approveProposal).not.toHaveBeenCalled();
    expect(webhookMocks.notifyChangeRequestModerators).toHaveBeenCalledTimes(1);
  });
});
