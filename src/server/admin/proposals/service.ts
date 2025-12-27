import "server-only";

import { requireUser, requireRole, type UserRole } from "~/server/auth";
import type { GearEditProposal } from "~/types/gear";
import {
  fetchPendingProposalsData,
  fetchRecentResolvedProposalsData,
  countRecentResolvedProposals,
  getProposalData,
  approveProposalData,
  mergeProposalData,
  rejectProposalData,
} from "./data";
import { evaluateForEvent } from "~/server/badges/service";
import { createNotification } from "~/server/notifications/service";

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

type ProposalGroups = {
  pending: ProposalGroup[];
  resolvedRecent: ProposalGroup[];
  resolvedRecentCount: number;
};

function groupProposals(proposals: EnrichedProposal[]): ProposalGroup[] {
  const groupedProposals = proposals.reduce<ProposalGroup[]>(
    (acc, proposal) => {
      const existingGroup = acc.find(
        (group) => group.gearId === proposal.gearId,
      );

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
    },
    [],
  );

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

export async function fetchGearProposals(): Promise<ProposalGroups> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as UserRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [pending, resolvedRecent, resolvedRecentCount] = await Promise.all([
    fetchPendingProposalsData(),
    fetchRecentResolvedProposalsData(since),
    countRecentResolvedProposals(since),
  ]);

  return {
    pending: groupProposals(pending as EnrichedProposal[]),
    resolvedRecent: groupProposals(resolvedRecent as EnrichedProposal[]),
    resolvedRecentCount,
  };
}

export async function fetchRecentResolvedProposals(
  days: number,
  limit?: number,
): Promise<ProposalGroup[]> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as UserRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const resolved = await fetchRecentResolvedProposalsData(since, limit);
  return groupProposals(resolved as EnrichedProposal[]);
}

export async function fetchPendingProposalGroups(): Promise<ProposalGroup[]> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as UserRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const pending = await fetchPendingProposalsData();
  return groupProposals(pending as EnrichedProposal[]);
}

export async function fetchResolvedProposalGroupsWithCount(
  days: number,
  limit?: number,
) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as UserRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [resolved, count] = await Promise.all([
    fetchRecentResolvedProposalsData(since, limit),
    countRecentResolvedProposals(since),
  ]);
  return {
    groups: groupProposals(resolved as EnrichedProposal[]),
    count,
    days,
  };
}

export async function approveProposal(
  id: string,
  filteredPayload: unknown = undefined,
  gearContext: { gearName: string; gearSlug: string },
) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as UserRole[])) {
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

  const gearRow = {
    name: gearContext.gearName,
    slug: gearContext.gearSlug,
  };

  // Emit badge event for contributor who created the proposal
  if (proposal.createdById) {
    await evaluateForEvent(
      { type: "edit.approved", context: { gearId: proposal.gearId } },
      proposal.createdById,
    );

    await createNotification({
      userId: proposal.createdById,
      type: "gear_spec_approved",
      title: "Your spec edit was approved!",
      body: `${gearRow.name ?? "Gear"} is now updated. Click to view the page.`,
      linkUrl: `/gear/${gearRow.slug}`,
      sourceType: "gear",
      sourceId: proposal.gearId,
      metadata: { proposalId: proposal.id },
    });
  }
}

export async function mergeProposal(id: string) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as UserRole[])) {
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
  if (!requireRole(session, ["ADMIN", "EDITOR"] as UserRole[])) {
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
