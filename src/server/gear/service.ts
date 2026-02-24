import "server-only";

import { z } from "zod";
import { track } from "@vercel/analytics/server";
import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";
import {
  getGearIdBySlug as getGearIdBySlugData,
  fetchGearBySlug as fetchGearBySlugData,
  fetchGearMetadataById as fetchGearMetadataByIdData,
  getGearLinkMpb as getGearLinkMpbData,
  isInWishlist as isInWishlistData,
  isOwned as isOwnedData,
  hasImageRequest as hasImageRequestData,
  getApprovedReviewsByGearId as getApprovedReviewsByGearIdData,
  getMyReviewStatus as getMyReviewStatusData,
  getGearStatsById as getGearStatsByIdData,
  addToWishlist as addToWishlistData,
  removeFromWishlist as removeFromWishlistData,
  addOwnership as addOwnershipData,
  removeOwnership as removeOwnershipData,
  addImageRequest as addImageRequestData,
  removeImageRequest as removeImageRequestData,
  fetchAllImageRequests as fetchAllImageRequestsData,
  createReview as createReviewData,
  deleteReviewById as deleteReviewByIdData,
  getReviewById as getReviewByIdData,
  hasOpenReviewFlag as hasOpenReviewFlagData,
  insertAuditLog as insertAuditLogData,
  insertReviewFlag as insertReviewFlagData,
  getPendingEditIdData,
  hasPendingEditsForGear,
  fetchPendingEditForGear,
  countPendingEditsForGear,
  resolveOpenReviewFlags as resolveOpenReviewFlagsData,
} from "./data";
import type { GearItem, RawSample } from "~/types/gear";
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
  fetchAlternativesByGearId,
  setGearAlternatives as setGearAlternativesData,
  type GearAlternativeRow,
  fetchRawSamplesByGearId,
  insertRawSample,
  deleteRawSample,
  fetchAllGearExportRowsData,
  type GearExportRow,
} from "./data";
import { getConstructionState } from "~/lib/utils";
import { headers } from "next/headers";
import {
  testReviewSafety,
  type ReviewModerationCode,
} from "~/server/reviews/moderation/service";
import { maybeGenerateReviewSummary } from "~/server/reviews/summary/service";

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
  status?: "PENDING" | "APPROVED" | "REJECTED";
}) {
  return createReviewData(params);
}

async function getReviewById(reviewId: string) {
  return getReviewByIdData(reviewId);
}

async function hasOpenReviewFlag(params: {
  reviewId: string;
  reporterUserId: string;
}) {
  return hasOpenReviewFlagData(params);
}

async function insertReviewFlag(params: {
  reviewId: string;
  reporterUserId: string;
}) {
  return insertReviewFlagData(params);
}

async function resolveOpenReviewFlags(params: {
  reviewId: string;
  status: "RESOLVED_KEEP" | "RESOLVED_REJECTED" | "RESOLVED_DELETED";
  resolvedByUserId: string;
}) {
  return resolveOpenReviewFlagsData(params);
}

async function deleteReviewById(reviewId: string) {
  return deleteReviewByIdData(reviewId);
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

export type RawSamplePayload = {
  fileUrl: string;
  originalFilename?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
};

export async function fetchRawSamples(slug: string): Promise<RawSample[]> {
  const gearId = await resolveGearIdOrThrow(slug);
  return fetchRawSamplesByGearId(gearId);
}

export async function addRawSampleToGear(
  slug: string,
  payload: RawSamplePayload,
): Promise<RawSample> {
  const { user } = await getSessionOrThrow();
  if (!requireRole(user, ["ADMIN", "SUPERADMIN"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const gearId = await resolveGearIdOrThrow(slug);

  // Check if gear type supports raw samples (only CAMERA)
  const gearMeta = await fetchGearMetadataById(gearId);
  if (gearMeta.gearType !== "CAMERA") {
    throw Object.assign(
      new Error("Raw samples are only supported for cameras"),
      { status: 400 },
    );
  }

  const currentSamples = await fetchRawSamplesByGearId(gearId);
  if (currentSamples.length >= 3) {
    throw Object.assign(
      new Error("Maximum of 3 samples allowed per gear item"),
      { status: 400 },
    );
  }
  return insertRawSample({
    gearId,
    fileUrl: payload.fileUrl,
    originalFilename: payload.originalFilename ?? null,
    contentType: payload.contentType ?? null,
    sizeBytes: payload.sizeBytes ?? null,
    uploadedByUserId: user.id,
  });
}

export async function removeRawSampleFromGear(
  slug: string,
  sampleId: string,
): Promise<{ ok: true }> {
  const { user } = await getSessionOrThrow();
  if (!requireRole(user, ["EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const gearId = await resolveGearIdOrThrow(slug);

  // Check if gear type supports raw samples (only CAMERA)
  const gearMeta = await fetchGearMetadataById(gearId);
  if (gearMeta.gearType !== "CAMERA") {
    throw Object.assign(
      new Error("Raw samples are only supported for cameras"),
      { status: 400 },
    );
  }

  await deleteRawSample(sampleId, gearId);
  return { ok: true };
}

// Fetch minimal gear metadata by id via data layer
export async function fetchGearMetadataById(id: string) {
  return fetchGearMetadataByIdData(id);
}

export async function resolveGearLinkMpb(options: {
  slug?: string | null;
  gearId?: string | null;
}) {
  return getGearLinkMpbData(options);
}

export async function toggleWishlist(slug: string, action: "add" | "remove") {
  const { user } = await getSessionOrThrow();
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
  const { user } = await getSessionOrThrow();
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

export async function toggleImageRequest(slug: string, action: "add" | "remove") {
  const { user } = await getSessionOrThrow();
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  if (action === "add") {
    const res = await addImageRequest(gearId, userId);
    if (res.alreadyExists)
      return { ok: false, reason: "already_requested" } as const;
    try {
      await track("image_request_toggle", { slug, action: "add" });
    } catch (eventErr) {
      console.error("Failed to record image request analytics", eventErr);
    }
    return { ok: true, action: "added" as const };
  }
  await removeImageRequest(gearId, userId);
  try {
    await track("image_request_toggle", { slug, action: "remove" });
  } catch (eventErr) {
    console.error("Failed to record image request analytics", eventErr);
  }
  return { ok: true, action: "removed" as const };
}

export async function fetchImageRequestStatus(slug: string) {
  const { user } = await getSessionOrThrow();
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  const hasRequested = await hasImageRequest(gearId, userId);
  return { hasRequested };
}

async function hasImageRequest(gearId: string, userId: string): Promise<boolean> {
  return hasImageRequestData(gearId, userId);
}

async function addImageRequest(gearId: string, userId: string) {
  return addImageRequestData(gearId, userId);
}

async function removeImageRequest(gearId: string, userId: string) {
  return removeImageRequestData(gearId, userId);
}

export async function fetchAllImageRequests() {
  // This is an admin-only function, but we don't enforce auth here
  // because the admin analytics page is already protected by layout/middleware
  return fetchAllImageRequestsData();
}

const reviewInput = z.object({
  content: z.string().min(1),
  genres: z.array(z.string()).min(1).max(3),
  recommend: z.boolean(),
  clientUserAgent: z.string().optional(),
});

type SubmitReviewResult =
  | {
      ok: true;
      review: {
        id: string;
        gearId: string;
        createdById: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        genres: unknown;
        recommend: boolean | null;
        content: string;
        createdAt: Date;
        updatedAt: Date;
      };
      moderation: { decision: "APPROVED" };
    }
  | {
      ok: false;
      type: "ALREADY_REVIEWED";
      message: string;
    }
  | {
      ok: false;
      type: "MODERATION_BLOCKED";
      code: ReviewModerationCode;
      message: string;
      retryAfterMs?: number;
    };

export async function submitReview(
  slug: string,
  body: unknown,
): Promise<SubmitReviewResult> {
  const { user } = await getSessionOrThrow();
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  const data = reviewInput.parse(body);
  const moderation = await testReviewSafety({
    userId,
    body: data.content,
    userAgent: data.clientUserAgent,
  });

  if (!moderation.ok) {
    return {
      ok: false,
      type: "MODERATION_BLOCKED",
      code: moderation.code,
      message: moderation.message,
      retryAfterMs: moderation.retryAfterMs,
    };
  }

  const res = await createReview({
    gearId,
    userId,
    content: moderation.normalizedBody,
    genres: data.genres,
    recommend: data.recommend,
    status: "APPROVED",
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
    return {
      ok: false,
      type: "ALREADY_REVIEWED",
      message: "You have already reviewed this gear item.",
    };
  }
  try {
    await track("review_submit_complete", {
      userId,
      gearId,
    });
  } catch (eventErr) {
    console.error("Failed to record review completion analytics", eventErr);
  }

  await evaluateForEvent({ type: "review.approved", context: { gearId } }, userId);
  void (async () => {
    try {
      const gearMeta = await fetchGearMetadataByIdData(gearId);
      await maybeGenerateReviewSummary({
        gearId,
        gearName: gearMeta.name ?? "this gear",
      });
    } catch (summaryError) {
      console.error("[submitReview] failed to refresh summary", summaryError);
    }
  })();

  return {
    ok: true,
    review: res.review,
    moderation: { decision: "APPROVED" },
  };
}

type FlagReviewResult =
  | { ok: true; type: "FLAG_CREATED" }
  | { ok: false; type: "NOT_FOUND"; message: string }
  | { ok: false; type: "OWN_REVIEW"; message: string }
  | { ok: false; type: "NOT_FLAGGABLE"; message: string }
  | { ok: false; type: "FLAG_ALREADY_OPEN"; message: string };

export async function flagReview(reviewId: string): Promise<FlagReviewResult> {
  const { user } = await getSessionOrThrow();
  const review = await getReviewById(reviewId);
  if (!review) {
    return { ok: false, type: "NOT_FOUND", message: "Review not found." };
  }
  if (review.createdById === user.id) {
    return {
      ok: false,
      type: "OWN_REVIEW",
      message: "You cannot flag your own review.",
    };
  }
  if (review.status !== "APPROVED") {
    return {
      ok: false,
      type: "NOT_FLAGGABLE",
      message: "Only approved reviews can be flagged.",
    };
  }

  const alreadyOpen = await hasOpenReviewFlag({
    reviewId,
    reporterUserId: user.id,
  });
  if (alreadyOpen) {
    return {
      ok: false,
      type: "FLAG_ALREADY_OPEN",
      message: "You already have an open report for this review.",
    };
  }

  await insertReviewFlag({
    reviewId,
    reporterUserId: user.id,
  });
  return { ok: true, type: "FLAG_CREATED" };
}

type DeleteOwnReviewResult =
  | { ok: true; type: "DELETED" }
  | { ok: false; type: "NOT_FOUND"; message: string }
  | { ok: false; type: "FORBIDDEN"; message: string };

export async function deleteOwnReview(
  reviewId: string,
): Promise<DeleteOwnReviewResult> {
  const { user } = await getSessionOrThrow();
  const review = await getReviewById(reviewId);

  if (!review) {
    return { ok: false, type: "NOT_FOUND", message: "Review not found." };
  }
  if (review.createdById !== user.id) {
    return {
      ok: false,
      type: "FORBIDDEN",
      message: "You can only delete your own review.",
    };
  }

  await resolveOpenReviewFlags({
    reviewId,
    status: "RESOLVED_DELETED",
    resolvedByUserId: user.id,
  });
  await deleteReviewById(reviewId);

  void (async () => {
    try {
      const gearMeta = await fetchGearMetadataByIdData(review.gearId);
      await maybeGenerateReviewSummary({
        gearId: review.gearId,
        gearName: gearMeta.name ?? "this gear",
      });
    } catch (summaryError) {
      console.error("[deleteOwnReview] failed to refresh summary", summaryError);
    }
  })();

  return { ok: true, type: "DELETED" };
}

export async function fetchApprovedReviews(slug: string) {
  const gearId = await resolveGearIdOrThrow(slug);
  const list = await getApprovedReviewsByGearId(gearId);
  return list;
}

export async function fetchMyReviewStatus(slug: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return { hasReview: false, status: null as unknown as string | null };
  }
  const user = session?.user;
  if (!user) {
    return { hasReview: false, status: null as unknown as string | null };
  }
  const gearId = await resolveGearIdOrThrow(slug);
  const my = await getMyReviewStatus(gearId, user.id);
  return { hasReview: Boolean(my), status: my?.status ?? null };
}

export async function fetchWishlistStatus(slug: string) {
  const { user } = await getSessionOrThrow();
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  const inWl = await isInWishlist(gearId, userId);
  return { inWishlist: inWl };
}

export async function fetchOwnershipStatus(slug: string) {
  const { user } = await getSessionOrThrow();
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
  const session = await getSessionOrThrow();
  if (!requireRole(session?.user, ["ADMIN"])) {
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

export async function fetchAllGearExportRows(): Promise<GearExportRow[]> {
  return fetchAllGearExportRowsData();
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
  const { user } = await getSessionOrThrow();
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
  const gearMeta = await fetchGearMetadataById(gearId);
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
      await approveProposal(proposal.id, normalizedPayload, {
        gearName: gearMeta?.name ?? "Gear",
        gearSlug: gearMeta?.slug ?? data.slug ?? gearId,
      });
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
  const { user } = await getSessionOrThrow();
  const gearId = await resolveGearIdOrThrow(slug);
  return getPendingEditIdData(gearId, user.id);
}

export async function fetchPendingEdit(slug: string) {
  const { user } = await getSessionOrThrow();
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
    analogCameraSpecs: {
      cameraType: string | null;
      captureMedium: string | null;
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
    const analogCameraSpecs =
      r.gearType === "ANALOG_CAMERA"
        ? {
            cameraType: r.analog_cameraType,
            captureMedium: r.analog_captureMedium,
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
      r.gearType === "CAMERA" || r.gearType === "ANALOG_CAMERA"
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
      analogCameraSpecs,
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
    if (src.analogAll && it.gearType === "ANALOG_CAMERA")
      countObject(src.analogAll);
    if (src.lensAll && it.gearType === "LENS") countObject(src.lensAll);
    if (src.fixedAll && it.gearType !== "LENS") countObject(src.fixedAll);
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

// --- Gear Alternatives ---

/**
 * Fetch alternatives for a gear item by slug (no auth required).
 * Returns the list of alternative gear items with metadata.
 */
export async function fetchGearAlternatives(
  slug: string,
): Promise<GearAlternativeRow[]> {
  const gearId = await resolveGearIdOrThrow(slug);
  return fetchAlternativesByGearId(gearId);
}

// Re-export type for convenience
export type { GearAlternativeRow };

const alternativesInput = z.object({
  alternatives: z.array(
    z.object({
      gearId: z.string().min(1),
      isCompetitor: z.boolean(),
    }),
  ),
});

/**
 * Update alternatives for a gear item (requires EDITOR+ role).
 * Replaces all existing alternatives with the provided list.
 */
export async function updateGearAlternatives(
  slug: string,
  body: unknown,
): Promise<{ ok: true }> {
  const session = await getSessionOrThrow();
  if (!requireRole(session?.user, ["EDITOR", "ADMIN", "SUPERADMIN"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const gearId = await resolveGearIdOrThrow(slug);
  const data = alternativesInput.parse(body);

  await setGearAlternativesData(
    gearId,
    data.alternatives.map((alt) => ({
      alternativeGearId: alt.gearId,
      isCompetitor: alt.isCompetitor,
    })),
  );

  return { ok: true };
}
