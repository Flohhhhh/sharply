import "server-only";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  brands,
  gear,
  mounts,
  gearPopularityDaily,
  gearPopularityLifetime,
  gearPopularityWindows,
  ownerships,
  popularityEvents,
  reviews,
  users,
  wishlists,
  cameraSpecs,
  lensSpecs,
  gearEdits,
  useCaseRatings,
  staffVerdicts,
  genres,
  auditLogs,
} from "~/server/db/schema";
import { hasEventForUserOnUtcDay } from "~/server/validation/dedupe";
import type { GearItem } from "~/types/gear";

// Reads
export async function getGearIdBySlug(slug: string): Promise<string | null> {
  const row = await db
    .select({ id: gear.id })
    .from(gear)
    .where(eq(gear.slug, slug))
    .limit(1);
  return row[0]?.id ?? null;
}

/** Count all gear items */
// moved counts to server/metrics

/**
 * Fetch comprehensive gear item with related specs by slug. Used by lib proxy.
 */
export async function fetchGearBySlug(slug: string): Promise<GearItem> {
  const gearItem = await db
    .select()
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(mounts, eq(gear.mountId, mounts.id))
    .where(eq(gear.slug, slug))
    .limit(1);

  if (!gearItem.length) {
    // mirror old behavior (caller may handle notFound)
    throw Object.assign(new Error("Not Found"), { status: 404 });
  }

  const base: GearItem = {
    ...gearItem[0]!.gear,
    cameraSpecs: null,
    lensSpecs: null,
  };

  if (gearItem[0]!.gear.gearType === "CAMERA") {
    const camera = await db
      .select()
      .from(cameraSpecs)
      .where(eq(cameraSpecs.gearId, gearItem[0]!.gear.id))
      .limit(1);
    return { ...base, cameraSpecs: camera[0] ?? null };
  }

  if (gearItem[0]!.gear.gearType === "LENS") {
    const lens = await db
      .select()
      .from(lensSpecs)
      .where(eq(lensSpecs.gearId, gearItem[0]!.gear.id))
      .limit(1);
    return { ...base, lensSpecs: lens[0] ?? null };
  }

  return base;
}

export type GearCardRow = {
  id: string;
  slug: string;
  name: string;
  searchName: string | null;
  gearType: string;
  brandName: string | null;
  brandSlug: string | null;
  thumbnailUrl: string | null;
  msrpUsdCents: number | null;
  releaseDate: Date | null;
  createdAt: Date;
  resolutionMp: number | null;
  focalLengthMinMm: number | null;
  focalLengthMaxMm: number | null;
};

export async function fetchLatestGearCardsData(
  limit: number,
): Promise<GearCardRow[]> {
  const rows = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      searchName: gear.searchName,
      gearType: gear.gearType,
      brandName: brands.name,
      brandSlug: brands.slug,
      thumbnailUrl: gear.thumbnailUrl,
      msrpUsdCents: gear.msrpUsdCents,
      releaseDate: gear.releaseDate,
      createdAt: gear.createdAt,
      resolutionMp: cameraSpecs.resolutionMp,
      focalLengthMinMm: lensSpecs.focalLengthMinMm,
      focalLengthMaxMm: lensSpecs.focalLengthMaxMm,
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(cameraSpecs, eq(gear.id, cameraSpecs.gearId))
    .leftJoin(lensSpecs, eq(gear.id, lensSpecs.gearId))
    .orderBy(desc(gear.createdAt))
    .limit(limit);
  return rows as unknown as GearCardRow[];
}

export type BrandGearCard = GearCardRow;

export async function fetchBrandGearData(
  brandId: string,
): Promise<BrandGearCard[]> {
  const rows = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      searchName: gear.searchName,
      gearType: gear.gearType,
      brandName: brands.name,
      brandSlug: brands.slug,
      thumbnailUrl: gear.thumbnailUrl,
      msrpUsdCents: gear.msrpUsdCents,
      releaseDate: gear.releaseDate,
      createdAt: gear.createdAt,
      resolutionMp: cameraSpecs.resolutionMp,
      focalLengthMinMm: lensSpecs.focalLengthMinMm,
      focalLengthMaxMm: lensSpecs.focalLengthMaxMm,
      mount: { id: mounts.id, value: mounts.value },
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(cameraSpecs, eq(gear.id, cameraSpecs.gearId))
    .leftJoin(lensSpecs, eq(gear.id, lensSpecs.gearId))
    .leftJoin(mounts, eq(gear.mountId, mounts.id))
    .where(eq(gear.brandId, brandId))
    .orderBy(desc(gear.createdAt));
  return rows as unknown as BrandGearCard[];
}

export async function isInWishlist(
  gearId: string,
  userId: string,
): Promise<boolean> {
  const row = await db
    .select({ userId: wishlists.userId })
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.gearId, gearId)))
    .limit(1);
  return row.length > 0;
}

export async function isOwned(
  gearId: string,
  userId: string,
): Promise<boolean> {
  const row = await db
    .select({ userId: ownerships.userId })
    .from(ownerships)
    .where(and(eq(ownerships.userId, userId), eq(ownerships.gearId, gearId)))
    .limit(1);
  return row.length > 0;
}

export async function getApprovedReviewsByGearId(gearId: string) {
  return db
    .select({
      id: reviews.id,
      content: reviews.content,
      genres: reviews.genres,
      recommend: reviews.recommend,
      createdAt: reviews.createdAt,
      createdBy: {
        id: users.id,
        name: users.name,
        image: users.image,
      },
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.createdById, users.id))
    .where(and(eq(reviews.gearId, gearId), eq(reviews.status, "APPROVED")))
    .orderBy(desc(reviews.createdAt));
}

export async function getMyReviewStatus(gearId: string, userId: string) {
  const row = await db
    .select({ id: reviews.id, status: reviews.status })
    .from(reviews)
    .where(and(eq(reviews.gearId, gearId), eq(reviews.createdById, userId)))
    .limit(1);
  return row[0] ?? null;
}

export async function getGearStatsById(gearId: string) {
  const lifetimeRow = await db
    .select({ v: gearPopularityLifetime.viewsLifetime })
    .from(gearPopularityLifetime)
    .where(eq(gearPopularityLifetime.gearId, gearId))
    .limit(1);
  const lifetimeViews = Number(lifetimeRow[0]?.v ?? 0);

  const win30Row = await db
    .select({
      v: gearPopularityWindows.viewsSum,
      d: gearPopularityWindows.asOfDate,
    })
    .from(gearPopularityWindows)
    .where(
      and(
        eq(gearPopularityWindows.gearId, gearId),
        eq(gearPopularityWindows.timeframe, "30d"),
      ),
    )
    .orderBy(desc(gearPopularityWindows.asOfDate))
    .limit(1);
  let views30d = Number(win30Row[0]?.v ?? 0);

  if (!views30d) {
    const d30Row = await db
      .select({
        v: sql<number>`COALESCE(SUM(${gearPopularityDaily.views}), 0)`,
      })
      .from(gearPopularityDaily)
      .where(
        and(
          eq(gearPopularityDaily.gearId, gearId),
          gte(gearPopularityDaily.date, sql`CURRENT_DATE - INTERVAL '30 days'`),
        ),
      );
    views30d = Number(d30Row[0]?.v ?? 0);
  }

  const [wlRow, ownRow] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)` })
      .from(wishlists)
      .where(eq(wishlists.gearId, gearId)),
    db
      .select({ c: sql<number>`count(*)` })
      .from(ownerships)
      .where(eq(ownerships.gearId, gearId)),
  ]);

  const wishlistTotal = Number(wlRow[0]?.c ?? 0);
  const ownershipTotal = Number(ownRow[0]?.c ?? 0);

  return { lifetimeViews, views30d, wishlistTotal, ownershipTotal };
}

export async function fetchUseCaseRatingsByGearIdData(gearId: string) {
  return db
    .select({
      score: useCaseRatings.score,
      note: useCaseRatings.note,
      genreId: genres.id,
      genreName: genres.name,
      genreSlug: genres.slug,
    })
    .from(useCaseRatings)
    .leftJoin(genres, eq(useCaseRatings.genreId, genres.id))
    .where(eq(useCaseRatings.gearId, gearId));
}

export async function fetchStaffVerdictByGearIdData(gearId: string) {
  const rows = await db
    .select()
    .from(staffVerdicts)
    .where(eq(staffVerdicts.gearId, gearId))
    .limit(1);
  return rows[0] ?? null;
}

export async function fetchAllGearSlugsData() {
  const rows = await db.select({ slug: gear.slug }).from(gear);
  return rows.map((r) => r.slug);
}

export type GearEditView = {
  id: string;
  createdAt: Date;
  status: (typeof gearEdits.status.enumValues)[number];
  payload: unknown;
  gearId: string | null;
  gearName: string | null;
  gearSlug: string | null;
  gearType: string | null;
};

export async function fetchGearEditByIdData(
  id: string,
): Promise<GearEditView | null> {
  const rows = await db
    .select({
      id: gearEdits.id,
      createdAt: gearEdits.createdAt,
      status: gearEdits.status,
      payload: gearEdits.payload,
      gearId: gearEdits.gearId,
      gearName: gear.name,
      gearSlug: gear.slug,
      gearType: gear.gearType,
    })
    .from(gearEdits)
    .leftJoin(gear, eq(gearEdits.gearId, gear.id))
    .where(eq(gearEdits.id, id))
    .limit(1);
  return (rows[0] as unknown as GearEditView) ?? null;
}

export type ContributorRow = {
  userId: string;
  name: string | null;
  image: string | null;
  payload: unknown;
};

export async function fetchContributorsByGearIdData(
  gearId: string,
): Promise<ContributorRow[]> {
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      image: users.image,
      payload: gearEdits.payload,
    })
    .from(gearEdits)
    .innerJoin(users, eq(gearEdits.createdById, users.id))
    .where(eq(gearEdits.gearId, gearId));
  return rows as unknown as ContributorRow[];
}

// Writes
export async function addToWishlist(gearId: string, userId: string) {
  const exists = await db
    .select({ userId: wishlists.userId })
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.gearId, gearId)))
    .limit(1);
  if (exists.length > 0) return { alreadyExists: true } as const;

  await db.insert(wishlists).values({ userId, gearId });

  const deduped = await hasEventForUserOnUtcDay({
    gearId,
    userId,
    eventType: "wishlist_add",
  });
  if (!deduped) {
    await db.insert(popularityEvents).values({
      gearId,
      userId,
      eventType: "wishlist_add",
    });
  }
  return { added: true, alreadyExists: false } as const;
}

export async function removeFromWishlist(gearId: string, userId: string) {
  await db
    .delete(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.gearId, gearId)));
  return { removed: true } as const;
}

export async function addOwnership(gearId: string, userId: string) {
  const exists = await db
    .select({ userId: ownerships.userId })
    .from(ownerships)
    .where(and(eq(ownerships.userId, userId), eq(ownerships.gearId, gearId)))
    .limit(1);
  if (exists.length > 0) return { alreadyExists: true } as const;

  await db.insert(ownerships).values({ userId, gearId });

  const deduped = await hasEventForUserOnUtcDay({
    gearId,
    userId,
    eventType: "owner_add",
  });
  if (!deduped) {
    await db.insert(popularityEvents).values({
      gearId,
      userId,
      eventType: "owner_add",
    });
  }
  return { added: true, alreadyExists: false } as const;
}

export async function removeOwnership(gearId: string, userId: string) {
  await db
    .delete(ownerships)
    .where(and(eq(ownerships.userId, userId), eq(ownerships.gearId, gearId)));
  return { removed: true } as const;
}

export async function createReview(params: {
  gearId: string;
  userId: string;
  content: string;
  genres: string[];
  recommend: boolean;
}) {
  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(
        eq(reviews.gearId, params.gearId),
        eq(reviews.createdById, params.userId),
      ),
    )
    .limit(1);
  if (existing.length > 0)
    return { alreadyExists: true, review: null as any } as const;

  const inserted = await db
    .insert(reviews)
    .values({
      gearId: params.gearId,
      createdById: params.userId,
      content: params.content,
      genres: params.genres as any,
      recommend: params.recommend,
    })
    .returning();

  await db.insert(popularityEvents).values({
    gearId: params.gearId,
    userId: params.userId,
    eventType: "review_submit",
  });

  return { alreadyExists: false, review: inserted[0] } as const;
}

/** Insert a new gear edit proposal (normalized payload should be provided by service layer) */
export async function createGearEditProposal(params: {
  gearId: string;
  userId: string;
  payload: Record<string, unknown>;
  note?: string | null;
}) {
  const inserted = await db
    .insert(gearEdits)
    .values({
      gearId: params.gearId,
      createdById: params.userId,
      payload: params.payload as any,
      note: params.note ?? null,
      status: "PENDING",
    })
    .returning();
  return inserted[0]!;
}

/** Insert audit log entry */
export async function insertAuditLog(params: {
  action:
    | "GEAR_CREATE"
    | "GEAR_EDIT_PROPOSE"
    | "GEAR_EDIT_APPROVE"
    | "GEAR_EDIT_REJECT"
    | "GEAR_EDIT_MERGE";
  actorUserId: string;
  gearId?: string;
  gearEditId?: string;
}) {
  await db.insert(auditLogs).values(params);
}

/** Get pending edit ID for a user and gear */
export async function getPendingEditIdData(
  gearId: string,
  userId: string,
): Promise<string | null> {
  const row = await db
    .select({ id: gearEdits.id })
    .from(gearEdits)
    .where(
      and(
        eq(gearEdits.gearId, gearId),
        eq(gearEdits.createdById, userId),
        eq(gearEdits.status, "PENDING"),
      ),
    )
    .limit(1);
  return row[0]?.id ?? null;
}
