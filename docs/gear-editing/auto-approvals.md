# Gear spec change requests: auto-approval

When someone submits a gear spec edit, the server creates a `gear_edits` row (a change request), then either **applies it immediately** (auto-approved) or leaves it **`PENDING`** for moderator review. This document describes the two auto-approval paths (staff and trusted contributor), the **`autoSubmit`** switch that forces review, and where the behavior lives in code.

## Entry point

All of this runs in **`submitGearEditProposal`** in `src/server/gear/service.ts`, invoked from the app via **`actionSubmitGearProposal`** in `src/server/gear/actions.ts`.

The parsed body includes optional fields (see `proposalInput` in the same service file):

- `gearId` or `slug` (required together with payload)
- `payload` — diff-style spec changes
- `note` — optional contributor note
- **`autoSubmit`** — optional boolean; see below

## The `autoSubmit` flag (force review vs allow immediate apply)

Server rule (same gate for **both** staff and trusted auto-approval):

- If **`autoSubmit === false`**, the proposal **always** stays **`PENDING`** (assuming it was created successfully). Moderators are notified when applicable. **No** immediate apply, regardless of role or trust.
- If **`autoSubmit` is omitted or any value other than `false`** (typically `true` or left unset), the server **may** auto-approve when the rest of the conditions below are satisfied.

So `autoSubmit: false` is the explicit **“send this through the normal review queue”** override.

### In the product UI (editors and above only)

Editors, admins, and superadmins (see `requireRole(..., ["EDITOR"])` on gear edit surfaces) see an **“Auto-Submit”** checkbox:

- **`src/app/[locale]/(pages)/gear/_components/edit-gear/edit-modal-content.tsx`** — modal flow; checkbox labeled **Auto-Submit** next to “Show missing only”.
- **`src/app/[locale]/(pages)/gear/_components/edit-gear/edit-gear-form.tsx`** — full-page edit flow; same control when `showActions` is true and `canToggleAutoSubmit` is true.

`canToggleAutoSubmit` is set from server pages such as:

- `src/app/[locale]/(pages)/gear/[slug]/edit/page.tsx`
- `src/app/[locale]/(pages)/gear/[slug]/@edit/(.)edit/page.tsx`
- `src/app/[locale]/(pages)/lists/under-construction/page.tsx`

When **Auto-Submit** is **checked**, eligible staff submissions are applied immediately. When **unchecked**, staff intentionally submit **for moderator review** like a normal contributor (still creates a proposal; description in the submit confirmation dialog explains this).

Contributors **without** editor-level role **do not** see this checkbox. The form still sends an `autoSubmit` boolean on submit; today that value defaults from the same form state model (`Boolean(canToggleAutoSubmit)` when no controlled `autoSubmit` prop is used). **Trusted auto-approval on the server only runs when `autoSubmit !== false`**, so any client that always sends `autoSubmit: false` for non-staff will never trigger trusted auto-apply even if every other rule passes. Align non-staff clients with the contract above if trusted immediate apply should work from the UI.

## Shared preconditions (staff and trusted)

For **either** auto-approval path:

1. There must be **no other pending** change request for that gear (`hasPendingEditsForGear` is false).
2. **`autoSubmit` must not be `false`** (see above).

If either fails, the new row stays **`PENDING`** and **`notifyChangeRequestModerators`** may run (see `src/server/admin/proposals/webhook.ts`).

## Interaction with publication state

Publication state and completeness are separate:

- **`RUMORED`** items can still be edited by staff so specs can be prepared ahead of release.
- **`HIDDEN`** items can also still be edited internally.
- Trusted contributor auto-approval still keys off the existing **under-construction/completeness** logic, not the publication-state override.
- Public under-construction surfaces intentionally exclude rumored and hidden items, so "not yet public" and "public but incomplete" do not overlap.

## Staff auto-approval (editor role and above)

**Who:** `requireRole(user, ["EDITOR"])` — in practice **editor, admin, or superadmin** (role ordering in `src/lib/auth/auth-helpers.ts`).

**When:** Staff path is considered whenever the user passes the role check. It is evaluated **before** the trusted path; staff users do not use the trusted contributor approval function for this flow.

**What happens:** `approveProposal` in `src/server/admin/proposals/service.ts` runs. That enforces staff role again, loads the pending proposal, then calls **`approveProposalData`** (in `src/server/admin/proposals/data.ts`) to merge payload into gear and mark the edit approved. The approver recorded on the audit entry is the **staff** session user.

**Side effects:** Badge evaluation and an in-app **“Your spec edit was approved!”** notification for the **original submitter** (`notifyContributorOfApprovedGearEdit` in the proposals service). Successful staff auto-approvals also emit an immediate operational Discord webhook log via `notifyAutoApprovedChangeRequest` in `src/server/admin/proposals/webhook.ts`.

## Trusted contributor auto-approval (non-staff)

**Who:** Users who **do not** satisfy staff auto-approve **and** pass **`isTrustedAddOnlyAutoApprovalEligible`** in `src/server/gear/service.ts`.

**Trust signal:** At least **one** prior change request by the same user with **`status === APPROVED`** (`countApprovedGearEditsByUser` in `src/server/gear/data.ts`).

**Gear state:** The gear must be **under construction** (`getConstructionState` in `src/lib/utils.ts` — missing required catalog fields for that gear type).

**Payload shape:** The proposal must be **strictly add-only** (`isAddOnlyProposal` in `src/server/gear/service.ts`):

- For each included key under `core`, `camera`, `analogCamera`, `lens`, and `fixedLens`, the **current** value on the gear must be “empty” and the **proposed** value must be non-empty (no overwrites, no clearing).
- Same idea for top-level **`cameraCardSlots`** and **`videoModes`**: only allowed when the current value is empty and the proposal fills them.

**Slug:** Eligibility loads the full gear row by **`gearMeta.slug`**; if slug is missing, trusted eligibility is false.

**What happens:** **`applyTrustedContributorProposalApproval`** in `src/server/admin/proposals/service.ts` (not `approveProposal`). It verifies the session user is the **`createdById`** on that proposal, then calls **`approveProposalData`** with the contributor as the audit **actor** for the approve step, and runs the same **notification / badge** side effects as staff approval. Successful trusted auto-approvals also emit the same immediate operational Discord webhook log via `notifyAutoApprovedChangeRequest`.

## Response and caching

`submitGearEditProposal` returns `{ ok, proposal, autoApproved }`. When `autoApproved` is true, the client may treat the spec as live immediately.

`actionSubmitGearProposal` revalidates the gear page when `autoApproved` is true and the request body included a **`slug`** (see `src/server/gear/actions.ts`).

## Persisted decision metadata

- Each submitted proposal now stores a submission-time decision snapshot in `gear_edits.metadata.autoApprovalDecision`.
- The same decision snapshot is written onto the `GEAR_EDIT_PROPOSE` audit log row via `audit_logs.metadata.autoApprovalDecision`.
- The stored decision includes:
  - whether the request was eligible for auto-approval
  - the approval path (`staff`, `trusted_candidate`, `trusted_add_only`, or `none`)
  - the final reason code
  - the contributor's approved edit count when relevant
  - whether `autoSubmit` was explicitly disabled
  - whether another pending request already existed
- This avoids drift when admins review a request later, because the UI no longer has to recompute eligibility from the current DB state.

## Webhook logging

- **Auto-approved** submissions send an immediate Discord webhook event through `notifyAutoApprovedChangeRequest` with the approval path (`staff` vs `trusted_add_only`) and a compact change summary.
- **Pending** submissions continue to use `notifyChangeRequestModerators`, which opens or contributes to the aggregated pending-request window.
- Auto-approved submissions **do not** increment the pending window counters and **do not** appear in the standard pending-request summary webhook messages.

## Admin and console observability

- When a proposal is **not** auto-approved, `submitGearEditProposal` writes a structured `console.info` entry with the final reason code and relevant submission context.
- The admin approval queue reads `gear_edits.metadata.autoApprovalDecision` and shows a human-readable explanation on pending request items.
- The admin audit logs page reads `audit_logs.metadata.autoApprovalDecision` and shows the same explanation under `GEAR_EDIT_PROPOSE` rows.
- If a request was eligible but the immediate apply step failed, the persisted reason is updated to `auto_approval_apply_failed` and the proposal remains pending for manual review.

## Quick reference

| Concern | Location |
|--------|----------|
| Orchestration and gates | `src/server/gear/service.ts` (`submitGearEditProposal`, `isAddOnlyProposal`, `evaluateAutoApprovalDecision`) |
| Staff approve + trusted apply + notifications | `src/server/admin/proposals/service.ts` |
| DB apply / transactions | `src/server/admin/proposals/data.ts` (`approveProposalData`) |
| Proposal metadata persistence | `src/server/gear/data.ts` (`createGearEditProposal`, `updateGearEditMetadata`) |
| Approved-edit count for trust | `src/server/gear/data.ts` (`countApprovedGearEditsByUser`) |
| Under construction definition | `src/lib/utils.ts` (`getConstructionState`) |
| Moderator webhook for pending + auto-approved logging | `src/server/admin/proposals/webhook.ts` |
| Human-readable admin reason mapping | `src/lib/gear/auto-approval-reasons.ts` |
| Server action + revalidation | `src/server/gear/actions.ts` |
| Auto-Submit UI (staff) | `edit-gear-form.tsx`, `edit-modal-content.tsx` |

## Related product docs

- Broader editing and queue behavior: `docs/spec-editing-flow-design.md`

## TODO (reach)

- [ ] **LLM and/or explicit content sanity gate before immediate apply:** After all existing checks pass for an auto-approved path (**staff** via `approveProposal` and **trusted** via `applyTrustedContributorProposalApproval`), run a **lightweight model pass** on the normalized payload (and optionally contributor note) to confirm the content is **minimally trustworthy** for public gear pages—for example, that free-text fields look like plausible camera or lens spec language rather than junk, unrelated topics, or clearly unsafe or explicit strings. On failure, skip immediate apply, leave the proposal **`PENDING`**, and use the normal moderator path. Tune **who bypasses** the gate: e.g. **superadmin / admin** always skip; **editor** and **moderator** (if they gain auto-apply in the future) must pass the check, or only editors below admin—product decision. Implementation would sit at the boundary in `submitGearEditProposal` (or shared helper) immediately before calling `approveProposal` / `applyTrustedContributorProposalApproval`, with clear logging and metrics for overrides vs rejects.
