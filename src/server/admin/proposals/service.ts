import "server-only";

import { requireUser, requireRole, type SessionRole } from "~/server/auth";
import type { GearEditProposal } from "~/types/gear";
import {
  fetchGearProposalsData,
  getProposalData,
  approveProposalData,
  mergeProposalData,
  rejectProposalData,
} from "./data";
import { evaluateForEvent } from "~/server/badges/service";

type EnrichedProposal = GearEditProposal & {
  gearName: string;
  gearSlug: string;
  createdByName: string | null;
  beforeCore?: Record<string, unknown>;
  beforeCamera?: Record<string, unknown>;
  beforeLens?: Record<string, unknown>;
};

type ProposalGroup = {
  gearId: string;
  gearName: string;
  gearSlug: string;
  proposals: EnrichedProposal[];
};

export async function fetchGearProposals(): Promise<ProposalGroup[]> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const enriched = (await fetchGearProposalsData()) as EnrichedProposal[];

  // Group proposals by gear
  const groupedProposals = enriched.reduce<ProposalGroup[]>((acc, proposal) => {
    const existingGroup = acc.find((group) => group.gearId === proposal.gearId);

    if (existingGroup) {
      existingGroup.proposals.push(proposal);
    } else {
      acc.push({
        gearId: proposal.gearId,
        gearName: proposal.gearName,
        gearSlug: proposal.gearSlug,
        proposals: [proposal],
      });
    }

    return acc;
  }, []);

  // Sort groups by most recent proposal
  groupedProposals.sort((a, b) => {
    const aLatest = Math.max(
      ...a.proposals.map((p) => new Date(p.createdAt as any).getTime()),
    );
    const bLatest = Math.max(
      ...b.proposals.map((p) => new Date(p.createdAt as any).getTime()),
    );
    return bLatest - aLatest;
  });

  return groupedProposals;
}

export async function approveProposal(id: string, filteredPayload?: unknown) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const proposal = (await getProposalData(id)) as
    | (EnrichedProposal & { payload: unknown })
    | null;
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== "PENDING") {
    throw new Error("Proposal is not pending");
  }

  await approveProposalData(
    id,
    proposal.gearId,
    proposal.payload,
    session.user.id,
    filteredPayload,
  );

  // Emit badge event for contributor who created the proposal
  if (proposal.createdById) {
    await evaluateForEvent(
      { type: "edit.approved", context: { gearId: proposal.gearId } },
      proposal.createdById,
    );
  }
}

export async function mergeProposal(id: string) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const proposal = (await getProposalData(id)) as EnrichedProposal | null;
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== "PENDING") {
    throw new Error("Proposal is not pending");
  }

  await mergeProposalData(id, proposal.gearId, session.user.id);
}

export async function rejectProposal(id: string) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const proposal = (await getProposalData(id)) as EnrichedProposal | null;
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== "PENDING") {
    throw new Error("Proposal is not pending");
  }

  await rejectProposalData(id, proposal.gearId, session.user.id);
}
