import "server-only";

import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  brands,
  gear,
  mounts,
  gearMounts,
  gearPopularityDaily,
  gearPopularityLifetime,
  gearPopularityWindows,
  ownerships,
  popularityEvents,
  reviews,
  users,
  wishlists,
  cameraSpecs,
  analogCameraSpecs,
  cameraAfAreaSpecs,
  afAreaModes,
  cameraCardSlots,
  lensSpecs,
  fixedLensSpecs,
  gearEdits,
  useCaseRatings,
  staffVerdicts,
  genres,
  auditLogs,
  gearAlternatives,
  rawSamples,
  gearRawSamples,
} from "~/server/db/schema";
import { hasEventForUserOnUtcDay } from "~/server/validation/dedupe";
import { incrementGearPopularityIntraday } from "~/server/popularity/data";
import type { Gear, GearItem } from "~/types/gear";
import { fetchVideoModesByGearId } from "~/server/video-modes/data";

// Reads
export async function getGearIdBySlug(slug: string): Promise<string | null> {
  const row = await db
    .select({ id: gear.id })
    .from(gear)
    .where(eq(gear.slug, slug))
    .limit(1);
  return row[0]?.id ?? null;
}

export async function getGearLinkMpb(params: {
  slug?: string | null;
  gearId?: string | null;
}): Promise<string | null> {
  const { slug, gearId } = params;
  if (!slug && !gearId) return null;

  const row = await db
    .select({ linkMpb: gear.linkMpb })
    .from(gear)
    .where(slug ? eq(gear.slug, slug) : eq(gear.id, gearId ?? ""))
    .limit(1);

  return row[0]?.linkMpb ?? null;
}

/** Fetch full gearItem  by id */
export async function fetchGearMetadataById(id: string): Promise<Gear> {
  const result = await db
    .select()
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .where(eq(gear.id, id))
    .limit(1);

  if (!result.length) {
    throw Object.assign(new Error("Not Found"), { status: 404 });
  }

  if (!result[0]?.gear) {
    throw Object.assign(new Error("Not Found"), { status: 404 });
  }

  // // fetch all mount ids
  // const mountIdRows = await db
  //   .select({ mountId: gearMounts.mountId })
  //   .from(gearMounts)
  //   .where(eq(gearMounts.gearId, gearItem[0]!.gear.id));

  // return the gear item
  return {
    ...result[0].gear,
  };
}

/**
 * Fetch comprehensive gear item with related specs by slug. Used by lib proxy.
 */
export async function fetchGearBySlug(slug: string): Promise<GearItem> {
  const gearItem = await db
    .select()
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .where(eq(gear.slug, slug))
    .limit(1);

  if (!gearItem.length) {
    // mirror old behavior (caller may handle notFound)
    throw Object.assign(new Error("Not Found"), { status: 404 });
  }

  // Fetch all mount IDs for this gear from junction table
  const mountIdRows = await db
    .select({ mountId: gearMounts.mountId })
    .from(gearMounts)
    .where(eq(gearMounts.gearId, gearItem[0]!.gear.id));
  const rawSampleRows = await fetchRawSamplesByGearId(gearItem[0]!.gear.id);

  const base: GearItem = {
    ...gearItem[0]!.gear,
    cameraSpecs: null,
    analogCameraSpecs: null,
    lensSpecs: null,
    fixedLensSpecs: null,
    mountIds: mountIdRows.map((r) => r.mountId),
    rawSamples: rawSampleRows,
  };

  // CAMERA SPECS
  if (gearItem[0]!.gear.gearType === "CAMERA") {
    const camera = await db
      .select()
      .from(cameraSpecs)
      .where(eq(cameraSpecs.gearId, gearItem[0]!.gear.id))
      .limit(1);

    const afRows = await db
      .select()
      .from(cameraAfAreaSpecs)
      .innerJoin(
        afAreaModes,
        eq(cameraAfAreaSpecs.afAreaModeId, afAreaModes.id),
      )
      .where(
        and(
          eq(cameraAfAreaSpecs.gearId, gearItem[0]!.gear.id),
          eq(afAreaModes.brandId, gearItem[0]!.gear.brandId),
        ),
      );

    const modes = afRows.map((r) => r.af_area_modes);

    // card slots
    const slots = await db
      .select()
      .from(cameraCardSlots)
      .where(eq(cameraCardSlots.gearId, gearItem[0]!.gear.id));

    // fixed-lens specs (for integrated lens cameras)
    const fixed = await db
      .select()
      .from(fixedLensSpecs)
      .where(eq(fixedLensSpecs.gearId, gearItem[0]!.gear.id))
      .limit(1);
    const videoModes = await fetchVideoModesByGearId(gearItem[0]!.gear.id);

    return {
      ...base,
      cameraSpecs: camera[0] ? { ...camera[0], afAreaModes: modes } : null,
      cameraCardSlots: slots.length > 0 ? slots : [],
      fixedLensSpecs: fixed[0] ?? null,
      videoModes: videoModes.length ? videoModes : [],
    };
  } else if (gearItem[0]!.gear.gearType === "ANALOG_CAMERA") {
    const analog = await db
      .select()
      .from(analogCameraSpecs)
      .where(eq(analogCameraSpecs.gearId, gearItem[0]!.gear.id))
      .limit(1);

    const fixed = await db
      .select()
      .from(fixedLensSpecs)
      .where(eq(fixedLensSpecs.gearId, gearItem[0]!.gear.id))
      .limit(1);

    return {
      ...base,
      analogCameraSpecs: analog[0] ?? null,
      fixedLensSpecs: fixed[0] ?? null,
    };
    // LENS SPECS
  } else if (gearItem[0]!.gear.gearType === "LENS") {
    const lens = await db
      .select()
      .from(lensSpecs)
      .where(eq(lensSpecs.gearId, gearItem[0]!.gear.id))
      .limit(1);
    return { ...base, lensSpecs: lens[0] ?? null };
  } else {
    return base;
  }
}

export async function fetchRawSamplesByGearId(
  gearId: string,
): Promise<typeof rawSamples.$inferSelect[]> {
  const rows = await db
    .select({
      rawSample: rawSamples,
    })
    .from(gearRawSamples)
    .innerJoin(rawSamples, eq(rawSamples.id, gearRawSamples.rawSampleId))
    .where(eq(gearRawSamples.gearId, gearId))
    .where(eq(rawSamples.isDeleted, false))
    .orderBy(desc(gearRawSamples.createdAt));
  return rows.map((r) => r.rawSample) as typeof rawSamples.$inferSelect[];
}

export type RawSampleInsertParams = {
  gearId: string;
  fileUrl: string;
  originalFilename?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  uploadedByUserId?: string | null;
  uploadThingFileId?: string | null;
};

export async function insertRawSample(
  params: RawSampleInsertParams,
): Promise<typeof rawSamples.$inferSelect> {
  return await db.transaction(async (tx) => {
    const [sample] = await tx
      .insert(rawSamples)
      .values({
        fileUrl: params.fileUrl,
        originalFilename: params.originalFilename ?? null,
        contentType: params.contentType ?? null,
        sizeBytes: params.sizeBytes ?? null,
        uploadedByUserId: params.uploadedByUserId ?? null,
        uploadThingFileId: params.uploadThingFileId ?? null,
      })
      .returning();
    await tx.insert(gearRawSamples).values({
      gearId: params.gearId,
      rawSampleId: sample.id,
    });
    return sample;
  });
}

export async function deleteRawSample(sampleId: string, gearId: string) {
  return await db.transaction(async (tx) => {
    await tx
      .delete(gearRawSamples)
      .where(
        and(
          eq(gearRawSamples.gearId, gearId),
          eq(gearRawSamples.rawSampleId, sampleId),
        ),
      );

    await tx
      .update(rawSamples)
      .set({
        isDeleted: true,
        deletedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(rawSamples.id, sampleId));
  });
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
  msrpNowUsdCents: number | null;
  msrpAtLaunchUsdCents: number | null;
  releaseDate: Date | null;
  releaseDatePrecision: "DAY" | "MONTH" | "YEAR" | null;
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
      msrpNowUsdCents: gear.msrpNowUsdCents,
      msrpAtLaunchUsdCents: gear.msrpAtLaunchUsdCents,
      releaseDate: gear.releaseDate,
      releaseDatePrecision: gear.releaseDatePrecision,
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
      msrpUsdCents: gear.msrpNowUsdCents,
      releaseDate: gear.releaseDate,
      releaseDatePrecision: gear.releaseDatePrecision,
      createdAt: gear.createdAt,
      resolutionMp: cameraSpecs.resolutionMp,
      focalLengthMinMm: lensSpecs.focalLengthMinMm,
      focalLengthMaxMm: lensSpecs.focalLengthMaxMm,
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(cameraSpecs, eq(gear.id, cameraSpecs.gearId))
    .leftJoin(lensSpecs, eq(gear.id, lensSpecs.gearId))
    .where(eq(gear.brandId, brandId))
    .orderBy(desc(gear.createdAt));

  // Fetch mounts for all gear items in one query
  const gearIds = rows.map((r) => r.id);
  const mountsForGear = gearIds.length
    ? await db
        .select({
          gearId: gearMounts.gearId,
          mountId: mounts.id,
          mountValue: mounts.value,
        })
        .from(gearMounts)
        .innerJoin(mounts, eq(gearMounts.mountId, mounts.id))
        .where(
          sql`${gearMounts.gearId} IN (${sql.join(
            gearIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
    : [];

  // Group mounts by gear ID
  const mountsByGearId = new Map<
    string,
    Array<{ id: string; value: string }>
  >();
  for (const m of mountsForGear) {
    if (!mountsByGearId.has(m.gearId)) {
      mountsByGearId.set(m.gearId, []);
    }
    mountsByGearId
      .get(m.gearId)!
      .push({ id: m.mountId!, value: m.mountValue! });
  }

  // Attach mounts array to each gear item
  return rows.map((row) => ({
    ...row,
    mounts: mountsByGearId.get(row.id) || [],
  })) as unknown as BrandGearCard[];
}

export async function hasPendingEditsForGear(gearId: string): Promise<boolean> {
  const row = await db
    .select({ id: gearEdits.id })
    .from(gearEdits)
    .where(and(eq(gearEdits.gearId, gearId), eq(gearEdits.status, "PENDING")))
    .limit(1);
  return row.length > 0;
}

export async function fetchPendingEditForGear(gearId: string) {
  const rows = await db
    .select({
      id: gearEdits.id,
      status: gearEdits.status,
      createdById: gearEdits.createdById,
    })
    .from(gearEdits)
    .where(and(eq(gearEdits.gearId, gearId), eq(gearEdits.status, "PENDING")))
    .limit(1);
  return rows[0] ?? null;
}

export async function countPendingEditsForGear(
  gearId: string,
): Promise<number> {
  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(gearEdits)
    .where(and(eq(gearEdits.gearId, gearId), eq(gearEdits.status, "PENDING")));
  return Number(rows[0]?.c ?? 0);
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
        handle: users.handle,
        memberNumber: users.memberNumber,
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

export async function upsertStaffVerdictByGearIdData(params: {
  gearId: string;
  content?: string | null;
  pros?: string[] | null;
  cons?: string[] | null;
  whoFor?: string | null;
  notFor?: string | null;
  alternatives?: string[] | null;
  authorUserId: string;
}) {
  const {
    gearId,
    content,
    pros,
    cons,
    whoFor,
    notFor,
    alternatives,
    authorUserId,
  } = params;
  const values = {
    gearId,
    content: content ?? null,
    pros: (pros ?? null) as any,
    cons: (cons ?? null) as any,
    whoFor: whoFor ?? null,
    notFor: notFor ?? null,
    alternatives: (alternatives ?? null) as any,
    authorUserId,
  };

  const rows = await db
    .insert(staffVerdicts)
    .values(values)
    .onConflictDoUpdate({
      target: staffVerdicts.gearId,
      set: {
        content: values.content,
        pros: values.pros as any,
        cons: values.cons as any,
        whoFor: values.whoFor,
        notFor: values.notFor,
        alternatives: values.alternatives as any,
        authorUserId: values.authorUserId,
        updatedAt: sql`now()`,
      },
    })
    .returning();
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
  handle: string | null;
  memberNumber: number;
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
      handle: users.handle,
      memberNumber: users.memberNumber,
      image: users.image,
      payload: gearEdits.payload,
    })
    .from(gearEdits)
    .innerJoin(users, eq(gearEdits.createdById, users.id))
    .where(eq(gearEdits.gearId, gearId));
  return rows as unknown as ContributorRow[];
}

/** Minimal fields across ALL gear needed to evaluate construction state */
export type ConstructionMinimalRow = {
  id: string;
  slug: string;
  name: string;
  gearType: string;
  thumbnailUrl: string | null;
  brandId: string | null;
  brandName: string | null;
  mountId: string | null; // legacy single-mount pointer
  createdAt: Date;
  // Camera bits
  camera_sensorFormatId: string | null;
  camera_resolutionMp: number | string | null;
  analog_cameraType: string | null;
  analog_captureMedium: string | null;
  fixed_focalMin: number | null;
  fixed_focalMax: number | null;
  // Lens bits
  lens_focalMin: number | null;
  lens_focalMax: number | null;
  lens_isPrime: boolean | null;
  lens_maxApertureWide: number | string | null;
  // Full spec rows (optional, for completion computation)
  cameraAll?: Record<string, unknown> | null;
  analogAll?: Record<string, unknown> | null;
  lensAll?: Record<string, unknown> | null;
  fixedAll?: Record<string, unknown> | null;
};

export async function fetchAllGearForConstructionData(): Promise<
  Array<ConstructionMinimalRow & { mountIds: string[] }>
> {
  // Base rows with minimal joins
  const rows = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      gearType: gear.gearType,
      thumbnailUrl: gear.thumbnailUrl,
      brandId: gear.brandId,
      brandName: brands.name,
      mountId: gear.mountId,
      createdAt: gear.createdAt,
      camera_sensorFormatId: cameraSpecs.sensorFormatId,
      camera_resolutionMp: cameraSpecs.resolutionMp,
      analog_cameraType: analogCameraSpecs.cameraType,
      analog_captureMedium: analogCameraSpecs.captureMedium,
      fixed_focalMin: fixedLensSpecs.focalLengthMinMm,
      fixed_focalMax: fixedLensSpecs.focalLengthMaxMm,
      lens_focalMin: lensSpecs.focalLengthMinMm,
      lens_focalMax: lensSpecs.focalLengthMaxMm,
      lens_isPrime: lensSpecs.isPrime,
      lens_maxApertureWide: lensSpecs.maxApertureWide,
      cameraAll: cameraSpecs,
      analogAll: analogCameraSpecs,
      lensAll: lensSpecs,
      fixedAll: fixedLensSpecs,
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(cameraSpecs, eq(gear.id, cameraSpecs.gearId))
    .leftJoin(analogCameraSpecs, eq(gear.id, analogCameraSpecs.gearId))
    .leftJoin(fixedLensSpecs, eq(gear.id, fixedLensSpecs.gearId))
    .leftJoin(lensSpecs, eq(gear.id, lensSpecs.gearId));

  const gearIds = rows.map((r) => r.id);
  const mountsRows = gearIds.length
    ? await db
        .select({ gearId: gearMounts.gearId, mountId: gearMounts.mountId })
        .from(gearMounts)
        .where(
          sql`${gearMounts.gearId} IN (${sql.join(
            gearIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
    : [];

  const mountIdsByGearId = new Map<string, string[]>();
  for (const mr of mountsRows) {
    if (!mountIdsByGearId.has(mr.gearId!)) mountIdsByGearId.set(mr.gearId!, []);
    mountIdsByGearId.get(mr.gearId!)!.push(mr.mountId!);
  }

  return rows.map((r) => ({
    ...r,
    mountIds: mountIdsByGearId.get(r.id) ?? [],
  }));
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

    await incrementGearPopularityIntraday({
      gearId,
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

    await incrementGearPopularityIntraday({
      gearId,
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

  await incrementGearPopularityIntraday({
    gearId: params.gearId,
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

// --- Gear Alternatives ---

export type GearAlternativeRow = {
  gearId: string;
  name: string;
  slug: string;
  brandName: string | null;
  thumbnailUrl: string | null;
  gearType: string;
  isCompetitor: boolean;
};

/**
 * Fetch all alternatives for a gear item (both directions due to symmetric storage).
 * Returns the "other" gear item in each pair along with metadata.
 */
export async function fetchAlternativesByGearId(
  gearId: string,
): Promise<GearAlternativeRow[]> {
  // Query both directions: where gearId is gearAId or gearBId
  const rows = await db
    .select({
      gearAId: gearAlternatives.gearAId,
      gearBId: gearAlternatives.gearBId,
      isCompetitor: gearAlternatives.isCompetitor,
      // Gear A info
      gearAName: sql<string>`ga.name`.as("gear_a_name"),
      gearASlug: sql<string>`ga.slug`.as("gear_a_slug"),
      gearAThumbnail: sql<string | null>`ga.thumbnail_url`.as("gear_a_thumbnail"),
      gearAType: sql<string>`ga.gear_type`.as("gear_a_type"),
      gearABrandName: sql<string | null>`ba.name`.as("gear_a_brand_name"),
      // Gear B info
      gearBName: sql<string>`gb.name`.as("gear_b_name"),
      gearBSlug: sql<string>`gb.slug`.as("gear_b_slug"),
      gearBThumbnail: sql<string | null>`gb.thumbnail_url`.as("gear_b_thumbnail"),
      gearBType: sql<string>`gb.gear_type`.as("gear_b_type"),
      gearBBrandName: sql<string | null>`bb.name`.as("gear_b_brand_name"),
    })
    .from(gearAlternatives)
    .innerJoin(
      sql`${gear} AS ga`,
      sql`ga.id = ${gearAlternatives.gearAId}`,
    )
    .innerJoin(
      sql`${gear} AS gb`,
      sql`gb.id = ${gearAlternatives.gearBId}`,
    )
    .leftJoin(
      sql`${brands} AS ba`,
      sql`ba.id = ga.brand_id`,
    )
    .leftJoin(
      sql`${brands} AS bb`,
      sql`bb.id = gb.brand_id`,
    )
    .where(
      or(
        eq(gearAlternatives.gearAId, gearId),
        eq(gearAlternatives.gearBId, gearId),
      ),
    );

  // Map to return the "other" gear item (not the one we're querying for)
  return rows.map((row) => {
    const isA = row.gearAId === gearId;
    return {
      gearId: isA ? row.gearBId : row.gearAId,
      name: isA ? row.gearBName : row.gearAName,
      slug: isA ? row.gearBSlug : row.gearASlug,
      brandName: isA ? row.gearBBrandName : row.gearABrandName,
      thumbnailUrl: isA ? row.gearBThumbnail : row.gearAThumbnail,
      gearType: isA ? row.gearBType : row.gearAType,
      isCompetitor: row.isCompetitor,
    };
  });
}

/**
 * Helper to ensure canonical ordering for pair storage.
 * Returns [smaller, larger] by lexicographic comparison.
 */
function canonicalPair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA];
}

/**
 * Add an alternative relationship between two gear items.
 * Handles canonical ordering internally.
 */
export async function addGearAlternative(params: {
  gearId: string;
  alternativeGearId: string;
  isCompetitor: boolean;
}): Promise<void> {
  const { gearId, alternativeGearId, isCompetitor } = params;
  if (gearId === alternativeGearId) {
    throw new Error("Cannot add a gear item as its own alternative");
  }

  const [gearAId, gearBId] = canonicalPair(gearId, alternativeGearId);

  await db
    .insert(gearAlternatives)
    .values({ gearAId, gearBId, isCompetitor })
    .onConflictDoUpdate({
      target: [gearAlternatives.gearAId, gearAlternatives.gearBId],
      set: { isCompetitor },
    });
}

/**
 * Remove an alternative relationship between two gear items.
 */
export async function removeGearAlternative(params: {
  gearId: string;
  alternativeGearId: string;
}): Promise<void> {
  const { gearId, alternativeGearId } = params;
  const [gearAId, gearBId] = canonicalPair(gearId, alternativeGearId);

  await db
    .delete(gearAlternatives)
    .where(
      and(
        eq(gearAlternatives.gearAId, gearAId),
        eq(gearAlternatives.gearBId, gearBId),
      ),
    );
}

/**
 * Update the competitor flag for an existing alternative relationship.
 */
export async function updateGearAlternativeCompetitor(params: {
  gearId: string;
  alternativeGearId: string;
  isCompetitor: boolean;
}): Promise<void> {
  const { gearId, alternativeGearId, isCompetitor } = params;
  const [gearAId, gearBId] = canonicalPair(gearId, alternativeGearId);

  await db
    .update(gearAlternatives)
    .set({ isCompetitor })
    .where(
      and(
        eq(gearAlternatives.gearAId, gearAId),
        eq(gearAlternatives.gearBId, gearBId),
      ),
    );
}

/**
 * Bulk replace all alternatives for a gear item.
 * Removes existing alternatives not in the new list, adds/updates others.
 */
export async function setGearAlternatives(
  gearId: string,
  alternatives: Array<{ alternativeGearId: string; isCompetitor: boolean }>,
): Promise<void> {
  // Get current alternatives
  const current = await fetchAlternativesByGearId(gearId);
  const currentIds = new Set(current.map((a) => a.gearId));
  const newIds = new Set(alternatives.map((a) => a.alternativeGearId));

  // Remove alternatives not in new list
  for (const curr of current) {
    if (!newIds.has(curr.gearId)) {
      await removeGearAlternative({ gearId, alternativeGearId: curr.gearId });
    }
  }

  // Add or update alternatives in new list
  for (const alt of alternatives) {
    await addGearAlternative({
      gearId,
      alternativeGearId: alt.alternativeGearId,
      isCompetitor: alt.isCompetitor,
    });
  }
}
