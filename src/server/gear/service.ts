import "server-only";

import { z } from "zod";
import { auth, requireUser } from "~/server/auth";
import {
  getGearIdBySlug as getGearIdBySlugData,
  fetchGearBySlug as fetchGearBySlugData,
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
} from "./data";
import type { GearItem } from "~/types/gear";
import { normalizeProposalPayloadForDb } from "~/server/db/normalizers";
import {
  createGearEditProposal,
  fetchLatestGearCardsData,
  type GearCardRow,
  fetchContributorsByGearIdData,
  type ContributorRow,
  fetchUseCaseRatingsByGearIdData,
  fetchStaffVerdictByGearIdData,
  fetchAllGearSlugsData,
  fetchGearEditByIdData,
  type GearEditView,
  fetchBrandGearData,
} from "./data";

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

export async function toggleWishlist(slug: string, action: "add" | "remove") {
  const { user } = await requireUser();
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  if (action === "add") {
    const res = await addToWishlist(gearId, userId);
    if (res.alreadyExists)
      return { ok: false, reason: "already_in_wishlist" } as const;
    return { ok: true, action: "added" as const };
  }
  await removeFromWishlist(gearId, userId);
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
    return { ok: true, action: "added" as const };
  }
  await removeOwnership(gearId, userId);
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
  if (res.alreadyExists)
    return { ok: false, reason: "already_reviewed" } as const;
  return { ok: true, review: res.review } as const;
}

export async function fetchApprovedReviews(slug: string) {
  const gearId = await resolveGearIdOrThrow(slug);
  const list = await getApprovedReviewsByGearId(gearId);
  return list;
}

export async function fetchMyReviewStatus(slug: string) {
  const session = await auth();
  if (!session?.user?.id) return { hasReview: false, status: null as any };
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
  const data = proposalInput.parse(body);
  const normalizedPayload = normalizeProposalPayloadForDb(data.payload as any);
  const gearId =
    data.gearId ??
    (data.slug ? await resolveGearIdOrThrow(data.slug) : undefined);
  if (!gearId)
    throw Object.assign(new Error("Missing gear reference"), { status: 400 });
  const proposal = await createGearEditProposal({
    gearId,
    userId,
    payload: normalizedPayload,
    note: data.note ?? null,
  });
  // Audit log
  try {
    await insertAuditLogData({
      action: "GEAR_EDIT_PROPOSE",
      actorUserId: userId,
      gearId,
      gearEditId: proposal.id,
    });
  } catch {}
  return { ok: true as const, proposal };
}

export async function fetchPendingEditId(slug: string) {
  const { user } = await requireUser();
  const gearId = await resolveGearIdOrThrow(slug);
  return getPendingEditIdData(gearId, user.id);
}

// counts moved to metrics service
