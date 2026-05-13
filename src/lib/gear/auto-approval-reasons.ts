export type AutoApprovalPath =
  | "staff"
  | "trusted_candidate"
  | "trusted_add_only"
  | "none";

export type AutoApprovalReasonCode =
  | "auto_approved_staff"
  | "auto_approved_trusted_add_only"
  | "auto_submit_disabled"
  | "has_pending_request"
  | "missing_slug"
  | "no_prior_approved_edits"
  | "gear_not_under_construction"
  | "proposal_not_add_only"
  | "not_staff_or_trusted"
  | "auto_approval_apply_failed";

export type AutoApprovalDecisionMetadata = {
  eligible: boolean;
  path: AutoApprovalPath;
  reasonCode: AutoApprovalReasonCode;
  approvedEdits: number | null;
  autoSubmit: boolean | null;
  hasPendingEdits: boolean;
};

export type AutoApprovalMetadata = {
  autoApprovalDecision?: AutoApprovalDecisionMetadata;
};

const AUTO_APPROVAL_REASON_LABELS: Record<AutoApprovalReasonCode, string> = {
  auto_approved_staff: "Automatically approved as staff submission.",
  auto_approved_trusted_add_only:
    "Automatically approved as trusted contributor add-only submission.",
  auto_submit_disabled:
    "Submitted for review because Auto-Submit was disabled.",
  has_pending_request:
    "Another pending change request already existed for this gear at submission time.",
  missing_slug:
    "Trusted auto-approval could not run because the gear slug was unavailable.",
  no_prior_approved_edits:
    "Trusted auto-approval requires at least one previously approved spec edit by this contributor.",
  gear_not_under_construction:
    "Trusted auto-approval only applies to gear that is still under construction.",
  proposal_not_add_only:
    "Trusted auto-approval only applies to add-only proposals that fill empty fields without overwriting existing values.",
  not_staff_or_trusted:
    "The submitter did not qualify for staff or trusted contributor auto-approval.",
  auto_approval_apply_failed:
    "Auto-approval was attempted, but applying the change failed and the request was left pending.",
};

export function getAutoApprovalReasonLabel(
  reasonCode: AutoApprovalReasonCode,
): string {
  return AUTO_APPROVAL_REASON_LABELS[reasonCode];
}

export function formatAutoApprovalDecisionForAdmin(
  decision: AutoApprovalDecisionMetadata | null | undefined,
): string | null {
  if (!decision) return null;
  return getAutoApprovalReasonLabel(decision.reasonCode);
}

function isAutoApprovalPath(value: unknown): value is AutoApprovalPath {
  return (
    value === "staff" ||
    value === "trusted_candidate" ||
    value === "trusted_add_only" ||
    value === "none"
  );
}

function isAutoApprovalReasonCode(value: unknown): value is AutoApprovalReasonCode {
  return (
    value === "auto_approved_staff" ||
    value === "auto_approved_trusted_add_only" ||
    value === "auto_submit_disabled" ||
    value === "has_pending_request" ||
    value === "missing_slug" ||
    value === "no_prior_approved_edits" ||
    value === "gear_not_under_construction" ||
    value === "proposal_not_add_only" ||
    value === "not_staff_or_trusted" ||
    value === "auto_approval_apply_failed"
  );
}

export function getAutoApprovalDecisionFromMetadata(
  metadata: unknown,
): AutoApprovalDecisionMetadata | null {
  if (!metadata || typeof metadata !== "object") return null;
  const decision = (metadata as AutoApprovalMetadata).autoApprovalDecision;
  if (!decision || typeof decision !== "object") return null;
  if (typeof decision.eligible !== "boolean") return null;
  if (!isAutoApprovalPath(decision.path)) return null;
  if (!isAutoApprovalReasonCode(decision.reasonCode)) return null;
  if (
    decision.approvedEdits !== null &&
    typeof decision.approvedEdits !== "number"
  ) {
    return null;
  }
  if (decision.autoSubmit !== null && typeof decision.autoSubmit !== "boolean") {
    return null;
  }
  if (typeof decision.hasPendingEdits !== "boolean") return null;
  return decision;
}
