import "server-only";

import { db } from "~/server/db";
import { normalizeProposalPayloadForDb } from "~/server/db/normalizers";
import {
  gearEdits,
  gear,
  users,
  cameraSpecs,
  lensSpecs,
  auditLogs,
} from "~/server/db/schema";
import type { GearEditProposal } from "~/types/gear";
import { eq, desc, and, ne } from "drizzle-orm";

type ProposalSelect = {
  id: string;
  gearId: string;
  gearName: string;
  gearSlug: string;
  createdById: string;
  createdByName: string | null;
  status: GearEditProposal["status"];
  payload: GearEditProposal["payload"];
  note: string | null;
  createdAt: Date;
};

type Baseline = {
  core: Record<string, unknown>;
  camera: Record<string, unknown>;
  lens: Record<string, unknown>;
};

type EnrichedProposal = ProposalSelect & {
  beforeCore?: Record<string, unknown>;
  beforeCamera?: Record<string, unknown>;
  beforeLens?: Record<string, unknown>;
};

function pickSubset(
  src: Record<string, unknown>,
  keys?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!keys) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(keys)) out[k] = src?.[k] ?? null;
  return Object.keys(out).length > 0 ? out : undefined;
}

export async function fetchGearProposalsData(): Promise<EnrichedProposal[]> {
  // Fetch all gear edits with related data
  const proposals: ProposalSelect[] = await db
    .select({
      id: gearEdits.id,
      gearId: gearEdits.gearId,
      gearName: gear.name,
      gearSlug: gear.slug,
      createdById: gearEdits.createdById,
      createdByName: users.name,
      status: gearEdits.status,
      payload: gearEdits.payload,
      note: gearEdits.note,
      createdAt: gearEdits.createdAt,
    })
    .from(gearEdits)
    .innerJoin(gear, eq(gearEdits.gearId, gear.id))
    .innerJoin(users, eq(gearEdits.createdById, users.id))
    .orderBy(desc(gearEdits.createdAt));

  // Build a baseline cache per gear to compute "before" values
  const baselineCache = new Map<string, Baseline>();
  const getBaseline = async (gearId: string): Promise<Baseline> => {
    const cached = baselineCache.get(gearId);
    if (cached) return cached;
    const [g] = await db
      .select()
      .from(gear)
      .where(eq(gear.id, gearId))
      .limit(1);
    const [cam] = await db
      .select()
      .from(cameraSpecs)
      .where(eq(cameraSpecs.gearId, gearId))
      .limit(1);
    const [lens] = await db
      .select()
      .from(lensSpecs)
      .where(eq(lensSpecs.gearId, gearId))
      .limit(1);
    const baseline: Baseline = {
      core: (g ?? {}) as Record<string, unknown>,
      camera: (cam ?? {}) as Record<string, unknown>,
      lens: (lens ?? {}) as Record<string, unknown>,
    };
    baselineCache.set(gearId, baseline);
    return baseline;
  };

  // Attach before values for only the keys present in payload
  const enriched: EnrichedProposal[] = await Promise.all(
    proposals.map(async (p): Promise<EnrichedProposal> => {
      const base = (await getBaseline(p.gearId))!;
      const payload = (p.payload ?? {}) as Record<string, unknown> & {
        core?: Record<string, unknown>;
        camera?: Record<string, unknown>;
        lens?: Record<string, unknown>;
      };
      return {
        ...p,
        beforeCore: pickSubset(base.core, payload.core),
        beforeCamera: pickSubset(base.camera, payload.camera),
        beforeLens: pickSubset(base.lens, payload.lens),
      };
    }),
  );

  return enriched;
}

export async function getProposalData(
  id: string,
): Promise<GearEditProposal | null> {
  const rows: GearEditProposal[] = await db
    .select()
    .from(gearEdits)
    .where(eq(gearEdits.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function updateProposalStatusData(
  id: string,
  status: "APPROVED" | "REJECTED" | "MERGED",
) {
  await db.update(gearEdits).set({ status }).where(eq(gearEdits.id, id));
}

export async function approveProposalData(
  proposalId: string,
  gearId: string,
  payload: any,
  userId: string,
  filteredPayload?: any,
) {
  await db.transaction(async (tx) => {
    // Determine final payload (filtered if provided) and normalize to DB types
    const source = filteredPayload ?? payload;
    const normalized = normalizeProposalPayloadForDb(source as any);

    // Update the proposal status to APPROVED and persist only the applied changes
    await tx
      .update(gearEdits)
      .set({ status: "APPROVED", payload: normalized || {} })
      .where(eq(gearEdits.id, proposalId));

    // Audit: approved
    await tx.insert(auditLogs).values({
      action: "GEAR_EDIT_APPROVE",
      actorUserId: userId,
      gearId: gearId,
      gearEditId: proposalId,
    });

    // Apply the changes to the gear
    if (normalized && typeof normalized === "object") {
      const normalizedPayload = normalized as {
        core?: any;
        camera?: any;
        lens?: any;
      };
      if (normalizedPayload.core) {
        await tx
          .update(gear)
          .set(normalizedPayload.core)
          .where(eq(gear.id, gearId));
      }

      // Apply camera specs if they exist
      if (normalizedPayload.camera) {
        await tx
          .update(cameraSpecs)
          .set(normalizedPayload.camera)
          .where(eq(cameraSpecs.gearId, gearId));
      }

      // Apply lens specs if they exist
      if (normalizedPayload.lens) {
        await tx
          .update(lensSpecs)
          .set(normalizedPayload.lens)
          .where(eq(lensSpecs.gearId, gearId));
      }
    }

    // Set all other pending proposals for the same gear to MERGED
    await tx
      .update(gearEdits)
      .set({ status: "MERGED" })
      .where(
        and(
          eq(gearEdits.gearId, gearId),
          eq(gearEdits.status, "PENDING"),
          ne(gearEdits.id, proposalId),
        ),
      );

    // Audit: merged others (self-noted)
    await tx.insert(auditLogs).values({
      action: "GEAR_EDIT_MERGE",
      actorUserId: userId,
      gearId: gearId,
      gearEditId: proposalId,
    });
  });
}

export async function mergeProposalData(
  proposalId: string,
  gearId: string,
  userId: string,
) {
  await db
    .update(gearEdits)
    .set({ status: "MERGED" })
    .where(eq(gearEdits.id, proposalId));

  // Audit: merged
  try {
    await db.insert(auditLogs).values({
      action: "GEAR_EDIT_MERGE",
      actorUserId: userId,
      gearEditId: proposalId,
      gearId: gearId,
    });
  } catch (e) {
    console.warn("[merge] audit log failed", e);
  }
}

export async function rejectProposalData(
  proposalId: string,
  gearId: string,
  userId: string,
) {
  await db
    .update(gearEdits)
    .set({ status: "REJECTED" })
    .where(eq(gearEdits.id, proposalId));

  // Audit: rejected
  try {
    await db.insert(auditLogs).values({
      action: "GEAR_EDIT_REJECT",
      actorUserId: userId,
      gearId: gearId,
      gearEditId: proposalId,
    });
  } catch (e) {
    console.warn("[reject] audit log failed", e);
  }
}
