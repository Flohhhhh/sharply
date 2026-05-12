import { beforeEach,describe,expect,it,vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const gearDataMocks = vi.hoisted(() => ({
  countApprovedGearEditsByUser: vi.fn(),
  createGearEditProposal: vi.fn(),
  fetchGearBySlug: vi.fn(),
  fetchGearMetadataById: vi.fn(),
  getGearIdBySlug: vi.fn(),
  hasPendingEditsForGear: vi.fn(),
  insertAuditLog: vi.fn(),
  updateGearEditMetadata: vi.fn(),
}));

const proposalServiceMocks = vi.hoisted(() => ({
  approveProposal: vi.fn(),
  applyTrustedContributorProposalApproval: vi.fn(),
}));

const webhookMocks = vi.hoisted(() => ({
  notifyAutoApprovedChangeRequest: vi.fn(),
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

function makeUnderConstructionGear(overrides: Record<string, unknown> = {}) {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "nikon-zf",
    name: "Nikon Zf",
    gearType: "CAMERA",
    brandId: null,
    mountId: null,
    mountIds: [],
    cameraSpecs: {
      sensorFormatId: null,
      resolutionMp: null,
      afAreaModes: [],
      supportedBatteries: [],
      availableShutterTypes: [],
    },
    analogCameraSpecs: null,
    lensSpecs: null,
    fixedLensSpecs: null,
    cameraCardSlots: [],
    videoModes: [],
    ...overrides,
  };
}

describe("gear edit submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    authMocks.getSessionOrThrow.mockResolvedValue({
      user: {
        id: "user-1",
        role: "EDITOR",
        name: "Alex Photographer",
        email: "alex@example.com",
      },
    });

    normalizerMocks.normalizeProposalPayloadForDb.mockImplementation(
      (payload) => payload,
    );

    gearDataMocks.hasPendingEditsForGear.mockResolvedValue(false);
    gearDataMocks.countApprovedGearEditsByUser.mockResolvedValue(0);
    gearDataMocks.fetchGearBySlug.mockResolvedValue(makeUnderConstructionGear());
    gearDataMocks.fetchGearMetadataById.mockResolvedValue({
      gearType: "CAMERA",
      name: "Nikon Zf",
      slug: "nikon-zf",
    });
    gearDataMocks.createGearEditProposal.mockResolvedValue(makeProposal());
    gearDataMocks.insertAuditLog.mockResolvedValue(undefined);
    gearDataMocks.updateGearEditMetadata.mockResolvedValue(undefined);

    proposalServiceMocks.approveProposal.mockResolvedValue(undefined);
    proposalServiceMocks.applyTrustedContributorProposalApproval.mockResolvedValue(
      undefined,
    );
    webhookMocks.notifyAutoApprovedChangeRequest.mockResolvedValue(undefined);
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
    expect(gearDataMocks.createGearEditProposal).toHaveBeenCalledWith({
      gearId: "22222222-2222-4222-8222-222222222222",
      userId: "user-1",
      payload: { core: { name: "Updated name" } },
      metadata: {
        autoApprovalDecision: {
          eligible: true,
          path: "staff",
          reasonCode: "auto_approved_staff",
          approvedEdits: null,
          autoSubmit: null,
          hasPendingEdits: false,
        },
      },
      note: null,
    });
    expect(result.proposal.metadata).toEqual({
      autoApprovalDecision: {
        eligible: true,
        path: "staff",
        reasonCode: "auto_approved_staff",
        approvedEdits: null,
        autoSubmit: null,
        hasPendingEdits: false,
      },
    });
    expect(proposalServiceMocks.approveProposal).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      { core: { name: "Updated name" } },
      {
        gearName: "Nikon Zf",
        gearSlug: "nikon-zf",
      },
    );
    expect(
      proposalServiceMocks.applyTrustedContributorProposalApproval,
    ).not.toHaveBeenCalled();
    expect(webhookMocks.notifyAutoApprovedChangeRequest).toHaveBeenCalledWith({
      proposalId: "11111111-1111-4111-8111-111111111111",
      gearId: "22222222-2222-4222-8222-222222222222",
      gearType: "CAMERA",
      gearName: "Nikon Zf",
      gearSlug: "nikon-zf",
      createdByLabel: "Alex Photographer",
      changedFieldCount: 1,
      changedSectionCount: 1,
      hasNote: false,
      approvalPath: "staff",
      trustedApprovedEditCount: null,
    });
    expect(gearDataMocks.insertAuditLog).toHaveBeenCalledWith({
      action: "GEAR_EDIT_PROPOSE",
      actorUserId: "user-1",
      gearId: "22222222-2222-4222-8222-222222222222",
      gearEditId: "11111111-1111-4111-8111-111111111111",
      metadata: {
        autoApprovalDecision: {
          eligible: true,
          path: "staff",
          reasonCode: "auto_approved_staff",
          approvedEdits: null,
          autoSubmit: null,
          hasPendingEdits: false,
        },
      },
    });
    expect(console.info).not.toHaveBeenCalled();
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
    expect(result.proposal.metadata).toEqual({
      autoApprovalDecision: {
        eligible: false,
        path: "staff",
        reasonCode: "auto_submit_disabled",
        approvedEdits: null,
        autoSubmit: false,
        hasPendingEdits: false,
      },
    });
    expect(proposalServiceMocks.approveProposal).not.toHaveBeenCalled();
    expect(
      proposalServiceMocks.applyTrustedContributorProposalApproval,
    ).not.toHaveBeenCalled();
    expect(webhookMocks.notifyAutoApprovedChangeRequest).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      "[submitGearEditProposal] auto-approval skipped",
      {
        proposalId: "11111111-1111-4111-8111-111111111111",
        gearId: "22222222-2222-4222-8222-222222222222",
        userId: "user-1",
        reasonCode: "auto_submit_disabled",
        path: "staff",
        approvedEdits: null,
        autoSubmit: false,
        hasPendingEdits: false,
      },
    );
    expect(webhookMocks.notifyChangeRequestModerators).toHaveBeenCalledWith({
      proposalId: "11111111-1111-4111-8111-111111111111",
      gearId: "22222222-2222-4222-8222-222222222222",
      gearType: "CAMERA",
      gearName: "Nikon Zf",
      gearSlug: "nikon-zf",
      createdByLabel: "Alex Photographer",
      changedFieldCount: 1,
      changedSectionCount: 1,
      hasNote: false,
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
    expect(result.proposal.metadata).toEqual({
      autoApprovalDecision: {
        eligible: false,
        path: "trusted_candidate",
        reasonCode: "no_prior_approved_edits",
        approvedEdits: 0,
        autoSubmit: true,
        hasPendingEdits: false,
      },
    });
    expect(proposalServiceMocks.approveProposal).not.toHaveBeenCalled();
    expect(
      proposalServiceMocks.applyTrustedContributorProposalApproval,
    ).not.toHaveBeenCalled();
    expect(webhookMocks.notifyAutoApprovedChangeRequest).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      "[submitGearEditProposal] auto-approval skipped",
      {
        proposalId: "11111111-1111-4111-8111-111111111111",
        gearId: "22222222-2222-4222-8222-222222222222",
        userId: "user-1",
        reasonCode: "no_prior_approved_edits",
        path: "trusted_candidate",
        approvedEdits: 0,
        autoSubmit: true,
        hasPendingEdits: false,
      },
    );
    expect(webhookMocks.notifyChangeRequestModerators).toHaveBeenCalledTimes(1);
  });

  it("auto-approves trusted contributors for add-only under-construction edits", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1", role: "USER", name: "Alex Photographer" },
    });
    gearDataMocks.countApprovedGearEditsByUser.mockResolvedValue(1);

    const result = await submitGearEditProposal({
      gearId: "22222222-2222-4222-8222-222222222222",
      payload: { core: { brandId: "brand-1" } },
      autoSubmit: true,
    });

    expect(result.autoApproved).toBe(true);
    expect(result.proposal.status).toBe("APPROVED");
    expect(result.proposal.metadata).toEqual({
      autoApprovalDecision: {
        eligible: true,
        path: "trusted_add_only",
        reasonCode: "auto_approved_trusted_add_only",
        approvedEdits: 1,
        autoSubmit: true,
        hasPendingEdits: false,
      },
    });
    expect(
      proposalServiceMocks.applyTrustedContributorProposalApproval,
    ).toHaveBeenCalledTimes(1);
    expect(proposalServiceMocks.approveProposal).not.toHaveBeenCalled();
    expect(webhookMocks.notifyAutoApprovedChangeRequest).toHaveBeenCalledWith({
      proposalId: "11111111-1111-4111-8111-111111111111",
      gearId: "22222222-2222-4222-8222-222222222222",
      gearType: "CAMERA",
      gearName: "Nikon Zf",
      gearSlug: "nikon-zf",
      createdByLabel: "Alex Photographer",
      changedFieldCount: 1,
      changedSectionCount: 1,
      hasNote: false,
      approvalPath: "trusted_add_only",
      trustedApprovedEditCount: 1,
    });
    expect(console.info).not.toHaveBeenCalled();
    expect(webhookMocks.notifyChangeRequestModerators).not.toHaveBeenCalled();
  });

  it("keeps trusted contributors pending when they overwrite an existing value", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1", role: "USER", name: "Alex Photographer" },
    });
    gearDataMocks.countApprovedGearEditsByUser.mockResolvedValue(1);
    gearDataMocks.fetchGearBySlug.mockResolvedValue(
      makeUnderConstructionGear({ brandId: "existing-brand" }),
    );

    const result = await submitGearEditProposal({
      gearId: "22222222-2222-4222-8222-222222222222",
      payload: { core: { brandId: "brand-1" } },
      autoSubmit: true,
    });

    expect(result.autoApproved).toBe(false);
    expect(result.proposal.status).toBe("PENDING");
    expect(result.proposal.metadata).toEqual({
      autoApprovalDecision: {
        eligible: false,
        path: "trusted_candidate",
        reasonCode: "proposal_not_add_only",
        approvedEdits: 1,
        autoSubmit: true,
        hasPendingEdits: false,
      },
    });
    expect(proposalServiceMocks.approveProposal).not.toHaveBeenCalled();
    expect(
      proposalServiceMocks.applyTrustedContributorProposalApproval,
    ).not.toHaveBeenCalled();
    expect(webhookMocks.notifyAutoApprovedChangeRequest).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      "[submitGearEditProposal] auto-approval skipped",
      {
        proposalId: "11111111-1111-4111-8111-111111111111",
        gearId: "22222222-2222-4222-8222-222222222222",
        userId: "user-1",
        reasonCode: "proposal_not_add_only",
        path: "trusted_candidate",
        approvedEdits: 1,
        autoSubmit: true,
        hasPendingEdits: false,
      },
    );
    expect(webhookMocks.notifyChangeRequestModerators).toHaveBeenCalledTimes(1);
  });

  it("keeps trusted contributors pending when they clear a value", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1", role: "USER", name: "Alex Photographer" },
    });
    gearDataMocks.countApprovedGearEditsByUser.mockResolvedValue(1);

    const result = await submitGearEditProposal({
      gearId: "22222222-2222-4222-8222-222222222222",
      payload: { core: { brandId: null } },
      autoSubmit: true,
    });

    expect(result.autoApproved).toBe(false);
    expect(result.proposal.status).toBe("PENDING");
    expect(result.proposal.metadata).toEqual({
      autoApprovalDecision: {
        eligible: false,
        path: "trusted_candidate",
        reasonCode: "proposal_not_add_only",
        approvedEdits: 1,
        autoSubmit: true,
        hasPendingEdits: false,
      },
    });
    expect(proposalServiceMocks.approveProposal).not.toHaveBeenCalled();
    expect(
      proposalServiceMocks.applyTrustedContributorProposalApproval,
    ).not.toHaveBeenCalled();
    expect(webhookMocks.notifyAutoApprovedChangeRequest).not.toHaveBeenCalled();
    expect(webhookMocks.notifyChangeRequestModerators).toHaveBeenCalledTimes(1);
  });

  it("auto-approves trusted contributors for empty-to-filled collection fields", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1", role: "USER", name: "Alex Photographer" },
    });
    gearDataMocks.countApprovedGearEditsByUser.mockResolvedValue(1);

    const result = await submitGearEditProposal({
      gearId: "22222222-2222-4222-8222-222222222222",
      payload: { videoModes: [{ resolutionKey: "4k-uhd", fps: 24 }] },
      autoSubmit: true,
    });

    expect(result.autoApproved).toBe(true);
    expect(result.proposal.status).toBe("APPROVED");
    expect(
      proposalServiceMocks.applyTrustedContributorProposalApproval,
    ).toHaveBeenCalledTimes(1);
    expect(proposalServiceMocks.approveProposal).not.toHaveBeenCalled();
    expect(webhookMocks.notifyAutoApprovedChangeRequest).toHaveBeenCalledWith({
      proposalId: "11111111-1111-4111-8111-111111111111",
      gearId: "22222222-2222-4222-8222-222222222222",
      gearType: "CAMERA",
      gearName: "Nikon Zf",
      gearSlug: "nikon-zf",
      createdByLabel: "Alex Photographer",
      changedFieldCount: 1,
      changedSectionCount: 1,
      hasNote: false,
      approvalPath: "trusted_add_only",
      trustedApprovedEditCount: 1,
    });
  });

  it("keeps trusted contributors pending when collection fields already contain values", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1", role: "USER", name: "Alex Photographer" },
    });
    gearDataMocks.countApprovedGearEditsByUser.mockResolvedValue(1);
    gearDataMocks.fetchGearBySlug.mockResolvedValue(
      makeUnderConstructionGear({
        videoModes: [{ resolutionKey: "fhd", fps: 30 }],
      }),
    );

    const result = await submitGearEditProposal({
      gearId: "22222222-2222-4222-8222-222222222222",
      payload: { videoModes: [{ resolutionKey: "4k-uhd", fps: 24 }] },
      autoSubmit: true,
    });

    expect(result.autoApproved).toBe(false);
    expect(result.proposal.status).toBe("PENDING");
    expect(result.proposal.metadata).toEqual({
      autoApprovalDecision: {
        eligible: false,
        path: "trusted_candidate",
        reasonCode: "proposal_not_add_only",
        approvedEdits: 1,
        autoSubmit: true,
        hasPendingEdits: false,
      },
    });
    expect(proposalServiceMocks.approveProposal).not.toHaveBeenCalled();
    expect(
      proposalServiceMocks.applyTrustedContributorProposalApproval,
    ).not.toHaveBeenCalled();
    expect(webhookMocks.notifyAutoApprovedChangeRequest).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      "[submitGearEditProposal] auto-approval skipped",
      {
        proposalId: "11111111-1111-4111-8111-111111111111",
        gearId: "22222222-2222-4222-8222-222222222222",
        userId: "user-1",
        reasonCode: "proposal_not_add_only",
        path: "trusted_candidate",
        approvedEdits: 1,
        autoSubmit: true,
        hasPendingEdits: false,
      },
    );
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
    expect(
      proposalServiceMocks.applyTrustedContributorProposalApproval,
    ).not.toHaveBeenCalled();
    expect(webhookMocks.notifyAutoApprovedChangeRequest).not.toHaveBeenCalled();
    expect(webhookMocks.notifyChangeRequestModerators).toHaveBeenCalledTimes(1);
  });

  it("keeps auto-approved submissions successful when the webhook send fails", async () => {
    webhookMocks.notifyAutoApprovedChangeRequest.mockRejectedValueOnce(
      new Error("discord down"),
    );

    const result = await submitGearEditProposal({
      gearId: "22222222-2222-4222-8222-222222222222",
      payload: { core: { name: "Updated name" } },
    });

    expect(result.autoApproved).toBe(true);
    expect(result.proposal.status).toBe("APPROVED");
    expect(proposalServiceMocks.approveProposal).toHaveBeenCalledTimes(1);
    expect(webhookMocks.notifyAutoApprovedChangeRequest).toHaveBeenCalledTimes(1);
    expect(console.info).not.toHaveBeenCalled();
    expect(webhookMocks.notifyChangeRequestModerators).not.toHaveBeenCalled();
  });

  it("stores a failed auto-approval reason when apply fails and leaves the request pending", async () => {
    proposalServiceMocks.approveProposal.mockRejectedValueOnce(new Error("db down"));

    const result = await submitGearEditProposal({
      gearId: "22222222-2222-4222-8222-222222222222",
      payload: { core: { name: "Updated name" } },
    });

    expect(result.autoApproved).toBe(false);
    expect(result.proposal.status).toBe("PENDING");
    expect(result.proposal.metadata).toEqual({
      autoApprovalDecision: {
        eligible: false,
        path: "staff",
        reasonCode: "auto_approval_apply_failed",
        approvedEdits: null,
        autoSubmit: null,
        hasPendingEdits: false,
      },
    });
    expect(gearDataMocks.updateGearEditMetadata).toHaveBeenCalledWith({
      gearEditId: "11111111-1111-4111-8111-111111111111",
      metadata: {
        autoApprovalDecision: {
          eligible: false,
          path: "staff",
          reasonCode: "auto_approval_apply_failed",
          approvedEdits: null,
          autoSubmit: null,
          hasPendingEdits: false,
        },
      },
    });
    expect(gearDataMocks.insertAuditLog).toHaveBeenCalledWith({
      action: "GEAR_EDIT_PROPOSE",
      actorUserId: "user-1",
      gearId: "22222222-2222-4222-8222-222222222222",
      gearEditId: "11111111-1111-4111-8111-111111111111",
      metadata: {
        autoApprovalDecision: {
          eligible: false,
          path: "staff",
          reasonCode: "auto_approval_apply_failed",
          approvedEdits: null,
          autoSubmit: null,
          hasPendingEdits: false,
        },
      },
    });
    expect(console.info).toHaveBeenCalledWith(
      "[submitGearEditProposal] auto-approval skipped",
      {
        proposalId: "11111111-1111-4111-8111-111111111111",
        gearId: "22222222-2222-4222-8222-222222222222",
        userId: "user-1",
        reasonCode: "auto_approval_apply_failed",
        path: "staff",
        approvedEdits: null,
        autoSubmit: null,
        hasPendingEdits: false,
      },
    );
    expect(webhookMocks.notifyAutoApprovedChangeRequest).not.toHaveBeenCalled();
    expect(webhookMocks.notifyChangeRequestModerators).toHaveBeenCalledTimes(1);
  });
});
