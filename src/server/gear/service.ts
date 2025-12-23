import "server-only";

import { z } from "zod";
import { track } from "@vercel/analytics/server";
import { auth, requireUser, requireRole } from "~/server/auth";
import type { UserRole } from "~/server/auth";
import {
  getGearIdBySlug as getGearIdBySlugData,
  fetchGearBySlug as fetchGearBySlugData,
  fetchGearMetadataById as fetchGearMetadataByIdData,
  isInWishlist as isInWishlistData,
  isOwned as isOwnedData,
  getApprovedReviewsByGearId as getApprovedReviewsByGearIdData,
  getMyReviewStatus as getMyReviewStatusData,
  getGearStatsById as getGearStatsByIdData,
  addToWishlist as addToWishlistData,
  removeFromWishlist as removeFromWishlistData,
  addOwnership as addOwnershipData,
  removeOwnership as removeOwnershipData,
  createReview as createReviewData,
  insertAuditLog as insertAuditLogData,
  getPendingEditIdData,
  hasPendingEditsForGear,
  fetchPendingEditForGear,
  countPendingEditsForGear,
} from "./data";
import type { GearItem } from "~/types/gear";
import { normalizeProposalPayloadForDb } from "~/server/db/normalizers";
import { evaluateForEvent } from "~/server/badges/service";
import { approveProposal } from "~/server/admin/proposals/service";
import {
  createGearEditProposal,
  fetchLatestGearCardsData,
  type GearCardRow,
  fetchContributorsByGearIdData,
  type ContributorRow,
  fetchUseCaseRatingsByGearIdData,
  fetchStaffVerdictByGearIdData,
  upsertStaffVerdictByGearIdData,
  fetchAllGearSlugsData,
  fetchGearEditByIdData,
  type GearEditView,
  fetchBrandGearData,
  fetchAllGearForConstructionData,
  type ConstructionMinimalRow,
} from "./data";
import { getConstructionState } from "~/lib/utils";

// Internal low-level reads moved to data.ts

async function isInWishlist(gearId: string, userId: string): Promise<boolean> {
  return isInWishlistData(gearId, userId);
}

async function isOwned(gearId: string, userId: string): Promise<boolean> {
  return isOwnedData(gearId, userId);
}

async function getApprovedReviewsByGearId(gearId: string) {
  return getApprovedReviewsByGearIdData(gearId);
}

async function getMyReviewStatus(gearId: string, userId: string) {
  return getMyReviewStatusData(gearId, userId);
}

async function getGearStatsById(gearId: string) {
  return getGearStatsByIdData(gearId);
}

// Internal low-level writes (delegate to data layer)
async function addToWishlist(gearId: string, userId: string) {
  return addToWishlistData(gearId, userId);
}

async function removeFromWishlist(gearId: string, userId: string) {
  return removeFromWishlistData(gearId, userId);
}

async function addOwnership(gearId: string, userId: string) {
  return addOwnershipData(gearId, userId);
}

async function removeOwnership(gearId: string, userId: string) {
  return removeOwnershipData(gearId, userId);
}

async function createReview(params: {
  gearId: string;
  userId: string;
  content: string;
  genres: string[];
  recommend: boolean;
}) {
  return createReviewData(params);
}

/**
 * Exported service (business rules + auth)
 */

export async function resolveGearIdOrThrow(slug: string) {
  const id = await getGearIdBySlugData(slug);
  if (!id) throw Object.assign(new Error("Gear not found"), { status: 404 });
  return id;
}

// Service-level helper: fetch core gear by slug via data layer
export async function fetchGearBySlug(slug: string): Promise<GearItem> {
  return fetchGearBySlugData(slug);
}

// Fetch minimal gear metadata by id via data layer
export async function fetchGearMetadataById(id: string) {
  return fetchGearMetadataByIdData(id);
}

export async function toggleWishlist(slug: string, action: "add" | "remove") {
  const { user } = await requireUser();
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  if (action === "add") {
    const res = await addToWishlist(gearId, userId);
    if (res.alreadyExists)
      return { ok: false, reason: "already_in_wishlist" } as const;
    try {
      await track("wishlist_toggle", { slug, action: "add" });
    } catch (eventErr) {
      console.error("Failed to record wishlist analytics", eventErr);
    }
    const evalRes = await evaluateForEvent(
      { type: "wishlist.added", context: { gearId } },
      userId,
    );
    return { ok: true, action: "added" as const, awarded: evalRes.awarded };
  }
  await removeFromWishlist(gearId, userId);
  try {
    await track("wishlist_toggle", { slug, action: "remove" });
  } catch (eventErr) {
    console.error("Failed to record wishlist analytics", eventErr);
  }
  return { ok: true, action: "removed" as const };
}

export async function toggleOwnership(slug: string, action: "add" | "remove") {
  const { user } = await requireUser();
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  if (action === "add") {
    const res = await addOwnership(gearId, userId);
    if (res.alreadyExists)
      return { ok: false, reason: "already_owned" } as const;
    try {
      await track("ownership_toggle", { slug, action: "add" });
    } catch (eventErr) {
      console.error("Failed to record ownership analytics", eventErr);
    }
    const evalRes = await evaluateForEvent(
      { type: "ownership.added", context: { gearId } },
      userId,
    );
    return { ok: true, action: "added" as const, awarded: evalRes.awarded };
  }
  await removeOwnership(gearId, userId);
  try {
    await track("ownership_toggle", { slug, action: "remove" });
  } catch (eventErr) {
    console.error("Failed to record ownership analytics", eventErr);
  }
  return { ok: true, action: "removed" as const };
}

const reviewInput = z.object({
  content: z.string().min(1),
  genres: z.array(z.string()).min(1).max(3),
  recommend: z.boolean(),
});

export async function submitReview(slug: string, body: unknown) {
  const { user } = await requireUser();
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  const data = reviewInput.parse(body);
  const res = await createReview({
    gearId,
    userId,
    content: data.content,
    genres: data.genres,
    recommend: data.recommend,
  });
  if (res.alreadyExists) {
    try {
      await track("review_submit_duplicate", {
        userId,
        gearId,
      });
    } catch (eventErr) {
      console.error("Failed to record duplicate review analytics", eventErr);
    }
    return { ok: false, reason: "already_reviewed" } as const;
  }
  try {
    await track("review_submit_complete", {
      userId,
      gearId,
    });
  } catch (eventErr) {
    console.error("Failed to record review completion analytics", eventErr);
  }
  return { ok: true, review: res.review } as const;
}

export async function fetchApprovedReviews(slug: string) {
  const gearId = await resolveGearIdOrThrow(slug);
  const list = await getApprovedReviewsByGearId(gearId);
  return list;
}

export async function fetchMyReviewStatus(slug: string) {
  const session = await auth();
  if (!session?.user?.id)
    return { hasReview: false, status: null as unknown as string | null };
  const gearId = await resolveGearIdOrThrow(slug);
  const my = await getMyReviewStatus(gearId, session.user.id);
  return { hasReview: Boolean(my), status: my?.status ?? null };
}

export async function fetchWishlistStatus(slug: string) {
  const { user } = await requireUser();
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  const inWl = await isInWishlist(gearId, userId);
  return { inWishlist: inWl };
}

export async function fetchOwnershipStatus(slug: string) {
  const { user } = await requireUser();
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  const owned = await isOwned(gearId, userId);
  return { isOwned: owned };
}

export async function fetchGearStats(slug: string) {
  const gearId = await resolveGearIdOrThrow(slug);
  const stats = await getGearStatsById(gearId);
  return { gearId, ...stats };
}

export async function fetchLatestGearCards(
  limit: number,
): Promise<GearCardRow[]> {
  return fetchLatestGearCardsData(limit);
}

export async function fetchContributorsByGearIdService(
  gearId: string,
): Promise<ContributorRow[]> {
  return fetchContributorsByGearIdData(gearId);
}

export async function fetchUseCaseRatings(slug: string) {
  const gearId = await resolveGearIdOrThrow(slug);
  return fetchUseCaseRatingsByGearIdData(gearId);
}

export async function fetchStaffVerdict(slug: string) {
  const gearId = await resolveGearIdOrThrow(slug);
  return fetchStaffVerdictByGearIdData(gearId);
}

const verdictInput = z.object({
  content: z.string().max(5000).nullable().optional(),
  pros: z.array(z.string().min(1)).max(50).nullable().optional(),
  cons: z.array(z.string().min(1)).max(50).nullable().optional(),
  whoFor: z.string().max(1000).nullable().optional(),
  notFor: z.string().max(1000).nullable().optional(),
  alternatives: z.array(z.string().min(1)).max(50).nullable().optional(),
});

export async function upsertStaffVerdict(slug: string, body: unknown) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN"] as UserRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const gearId = await resolveGearIdOrThrow(slug);
  const data = verdictInput.parse(body ?? {});
  const row = await upsertStaffVerdictByGearIdData({
    gearId,
    content: data.content ?? null,
    pros: data.pros ?? null,
    cons: data.cons ?? null,
    whoFor: data.whoFor ?? null,
    notFor: data.notFor ?? null,
    alternatives: data.alternatives ?? null,
    authorUserId: session.user.id,
  });
  return { ok: true as const, verdict: row };
}

export async function fetchAllGearSlugs() {
  return fetchAllGearSlugsData();
}

export async function fetchGearEditById(
  id: string,
): Promise<GearEditView | null> {
  return fetchGearEditByIdData(id);
}

export async function fetchGearForBrand(brandId: string) {
  return fetchBrandGearData(brandId);
}

const proposalInput = z
  .object({
    gearId: z.string().uuid().optional(),
    slug: z.string().min(1).optional(),
    payload: z.record(z.unknown()),
    note: z.string().max(500).nullish(),
  })
  .refine((v) => Boolean(v.gearId || v.slug), {
    message: "Either gearId or slug must be provided",
    path: ["gearId"],
  });

export async function submitGearEditProposal(body: unknown) {
  const { user } = await requireUser();
  const userId = user.id;
  const role = user.role ?? "USER";
  const data = proposalInput.parse(body);
  const normalizedPayload = normalizeProposalPayloadForDb(
    data.payload as Record<string, unknown>,
  );
  const gearId =
    data.gearId ??
    (data.slug ? await resolveGearIdOrThrow(data.slug) : undefined);
  if (!gearId)
    throw Object.assign(new Error("Missing gear reference"), { status: 400 });
  const hasPending = await hasPendingEditsForGear(gearId);
  const proposal = await createGearEditProposal({
    gearId,
    userId,
    payload: normalizedPayload,
    note: data.note ?? null,
  });
  let autoApproved = false;
  if (
    !hasPending &&
    (role === "SUPERADMIN" || role === "ADMIN" || role === "EDITOR")
  ) {
    try {
      await approveProposal(proposal.id, normalizedPayload);
      autoApproved = true;
    } catch (error) {
      console.error("[submitGearEditProposal] auto-approve failed", error);
    }
  }
  // Audit log
  try {
    await insertAuditLogData({
      action: "GEAR_EDIT_PROPOSE",
      actorUserId: userId,
      gearId,
      gearEditId: proposal.id,
    });
  } catch {}
  try {
    await track("gear_edit_submit_complete", {
      gearId,
      autoApproved,
    });
  } catch (eventErr) {
    console.error("Failed to record gear edit analytics", eventErr);
  }
  const resultProposal = autoApproved
    ? { ...proposal, status: "APPROVED" as const }
    : proposal;
  return { ok: true as const, proposal: resultProposal, autoApproved };
}

export async function fetchPendingEditId(slug: string) {
  const { user } = await requireUser();
  const gearId = await resolveGearIdOrThrow(slug);
  return getPendingEditIdData(gearId, user.id);
}

export async function fetchPendingEdit(slug: string) {
  const { user } = await requireUser();
  const gearId = await resolveGearIdOrThrow(slug);
  const pending = await fetchPendingEditForGear(gearId);
  if (!pending) return null;
  if (pending.createdById !== user.id) return null;
  return pending;
}

// counts moved to metrics service

export async function fetchPendingEditCountForGear(gearId: string) {
  return countPendingEditsForGear(gearId);
}

export type UnderConstructionRow = {
  id: string;
  slug: string;
  name: string;
  brandName: string | null;
  thumbnailUrl: string | null;
  hasImage: boolean;
  gearType: string;
  missingCount: number;
  missing: string[];
  completionPercent: number; // 0..100
  createdAt: Date;
  underConstruction: boolean;
  brandId?: string | null;
};

/**
 * Compute under-construction items with a threshold.
 * thresholdMissing: minimum number of missing key specs to include (default 1)
 */
export async function listUnderConstruction(
  thresholdMissing = 1,
  minCompletionPercent?: number,
): Promise<UnderConstructionRow[]> {
  const rows = await fetchAllGearForConstructionData();

  // Map to a minimal GearItem-like object only for getConstructionState
  type MinimalForConstruction = {
    id: string;
    slug: string;
    name: string;
    gearType: string;
    brandId: string | null;
    mountId: string | null;
    mountIds: string[];
    cameraSpecs: {
      sensorFormatId: string | null;
      resolutionMp: number | string | null;
    } | null;
    lensSpecs: {
      isPrime: boolean | null;
      focalLengthMinMm: number | null;
      focalLengthMaxMm: number | null;
      maxApertureWide: number | string | null;
    } | null;
    fixedLensSpecs: {
      focalLengthMinMm: number | null;
      focalLengthMaxMm: number | null;
    } | null;
  };

  const items: MinimalForConstruction[] = rows.map((r) => {
    const cameraSpecs =
      r.gearType === "CAMERA"
        ? {
            sensorFormatId: r.camera_sensorFormatId,
            resolutionMp: r.camera_resolutionMp,
          }
        : null;
    const lensSpecs =
      r.gearType === "LENS"
        ? {
            isPrime: r.lens_isPrime,
            focalLengthMinMm: r.lens_focalMin,
            focalLengthMaxMm: r.lens_focalMax,
            maxApertureWide: r.lens_maxApertureWide,
          }
        : null;
    const fixedLensSpecs =
      r.gearType === "CAMERA"
        ? {
            focalLengthMinMm: r.fixed_focalMin,
            focalLengthMaxMm: r.fixed_focalMax,
          }
        : null;
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      gearType: r.gearType,
      brandId: r.brandId,
      mountId: r.mountId,
      mountIds: r.mountIds,
      cameraSpecs,
      lensSpecs,
      fixedLensSpecs,
    };
  });

  const enriched = items.map((it, idx) => {
    const construction = getConstructionState(it as unknown as GearItem);
    const missing = construction.missing;
    // True completion based on presence of fields in spec objects + core fields
    const src = rows[idx]!;
    let totalFields = 0;
    let filledFields = 0;
    const countObject = (obj: Record<string, unknown> | null | undefined) => {
      if (!obj) return;
      for (const [, v] of Object.entries(obj)) {
        totalFields++;
        if (v != null && !(typeof v === "string" && v.trim() === "")) {
          filledFields++;
        }
      }
    };
    if (src.cameraAll && it.gearType === "CAMERA") countObject(src.cameraAll);
    if (src.lensAll && it.gearType === "LENS") countObject(src.lensAll);
    if (src.fixedAll && it.gearType === "CAMERA") countObject(src.fixedAll);
    // include brand/mount core
    const coreValues = [it.brandId, it.mountId];
    totalFields += coreValues.length;
    for (const v of coreValues) if (v) filledFields++;

    const completionPercent =
      totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    const base = rows[idx]!;
    return {
      id: base.id,
      slug: base.slug,
      name: base.name,
      brandName: base.brandName,
      thumbnailUrl: base.thumbnailUrl ?? null,
      hasImage: Boolean(base.thumbnailUrl),
      gearType: base.gearType,
      missingCount: missing.length,
      missing,
      completionPercent,
      createdAt: base.createdAt,
      underConstruction: construction.underConstruction,
      brandId: rows[idx]!.brandId ?? null,
    } satisfies UnderConstructionRow;
  });

  return enriched
    .filter((r) => {
      const meetsMissing = r.missingCount >= thresholdMissing;
      const meetsLowCompletion =
        typeof minCompletionPercent === "number"
          ? r.completionPercent < minCompletionPercent
          : false;
      return meetsMissing || meetsLowCompletion;
    })
    .sort((a, b) => {
      // Most missing first, then lowest completion, then newest
      if (b.missingCount !== a.missingCount)
        return b.missingCount - a.missingCount;
      if (a.completionPercent !== b.completionPercent)
        return a.completionPercent - b.completionPercent;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}
