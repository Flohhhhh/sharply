import "server-only";

import { and,count,desc,eq,max,min,or,sql } from "drizzle-orm";
import type {
  ExifTrackedCameraHistoryEntry,
  ExifTrackedCameraSummary,
  ExifTrackingHistoryResponse,
  ExifTrackingPrimaryCountType,
  ExifViewerMatchedGear,
} from "~/app/[locale]/(pages)/(tools)/exif-viewer/types";
import { db } from "~/server/db";
import {
  exifShutterReadings,
  exifTrackedCameras,
  gear,
  gearExifAliases,
} from "~/server/db/schema";

type SelectExecutor = Pick<typeof db, "select">;
type UpdateExecutor = SelectExecutor & Pick<typeof db, "update">;

type GearExifAliasCandidate = {
  id: string;
  slug: string;
  name: string;
};

type TrackedCameraPreview = {
  trackedCamera: ExifTrackedCameraSummary;
  matchedGear: ExifViewerMatchedGear | null;
};

type DeleteTrackedExifReadingResult = {
  deletedReadingId: string;
  trackedCamera: ExifTrackedCameraSummary | null;
  matchedGear: ExifViewerMatchedGear | null;
};

function buildMatchedGear(
  value:
    | {
        id: string;
        slug: string;
        name: string;
      }
    | null
    | undefined,
): ExifViewerMatchedGear | null {
  if (!value) return null;

  return {
    id: value.id,
    slug: value.slug,
    name: value.name,
  };
}

async function fetchMatchedGearById(params: {
  gearId: string | null;
  tx?: SelectExecutor;
}): Promise<ExifViewerMatchedGear | null> {
  if (!params.gearId) {
    return null;
  }

  const executor = params.tx ?? db;
  const row = await executor
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
    })
    .from(gear)
    .where(eq(gear.id, params.gearId))
    .limit(1);

  return buildMatchedGear(row[0]);
}

async function fetchTrackedCameraSummaryById(params: {
  trackedCameraId: string;
  tx?: SelectExecutor;
}): Promise<TrackedCameraPreview | null> {
  const executor = params.tx ?? db;
  const trackedCameraRow = await executor
    .select({
      id: exifTrackedCameras.id,
      gearId: exifTrackedCameras.gearId,
    })
    .from(exifTrackedCameras)
    .where(eq(exifTrackedCameras.id, params.trackedCameraId))
    .limit(1);

  const trackedCamera = trackedCameraRow[0];
  if (!trackedCamera) {
    return null;
  }

  const [countRow, latestRow, matchedGear] = await Promise.all([
    executor
      .select({
        readingCount: count(),
      })
      .from(exifShutterReadings)
      .where(eq(exifShutterReadings.trackedCameraId, trackedCamera.id)),
    executor
      .select({
        latestPrimaryCountValue: exifShutterReadings.primaryCountValue,
        latestCaptureAt: exifShutterReadings.captureAt,
      })
      .from(exifShutterReadings)
      .where(eq(exifShutterReadings.trackedCameraId, trackedCamera.id))
      .orderBy(
        sql`${exifShutterReadings.captureAt} DESC NULLS LAST`,
        desc(exifShutterReadings.createdAt),
      )
      .limit(1),
    fetchMatchedGearById({
      gearId: trackedCamera.gearId,
      tx: executor,
    }),
  ]);

  return {
    trackedCamera: {
      id: trackedCamera.id,
      readingCount: Number(countRow[0]?.readingCount ?? 0),
      latestPrimaryCountValue: latestRow[0]?.latestPrimaryCountValue ?? null,
      latestCaptureAt: latestRow[0]?.latestCaptureAt?.toISOString() ?? null,
    },
    matchedGear,
  };
}

async function syncTrackedCameraSeenWindow(params: {
  trackedCameraId: string;
  tx: UpdateExecutor;
}) {
  const windowRows = await params.tx
    .select({
      firstSeenAt: min(
        sql<string>`COALESCE(${exifShutterReadings.captureAt}, ${exifShutterReadings.createdAt})`,
      ),
      lastSeenAt: max(
        sql<string>`COALESCE(${exifShutterReadings.captureAt}, ${exifShutterReadings.createdAt})`,
      ),
    })
    .from(exifShutterReadings)
    .where(eq(exifShutterReadings.trackedCameraId, params.trackedCameraId));

  const windowRow = windowRows[0];
  const firstSeenAt = windowRow?.firstSeenAt
    ? new Date(windowRow.firstSeenAt)
    : null;
  const lastSeenAt = windowRow?.lastSeenAt
    ? new Date(windowRow.lastSeenAt)
    : null;

  await params.tx
    .update(exifTrackedCameras)
    .set({
      firstSeenAt,
      lastSeenAt,
      updatedAt: new Date(),
    })
    .where(eq(exifTrackedCameras.id, params.trackedCameraId));
}

export async function findGearExifAliasMatches(params: {
  makeNormalized: string | null;
  modelNormalized: string | null;
  normalizedBrand: string | null;
}): Promise<GearExifAliasCandidate[]> {
  if (!params.modelNormalized) {
    return [];
  }

  const brandCondition = params.normalizedBrand
    ? or(
        eq(gearExifAliases.normalizedBrand, params.normalizedBrand),
        sql`${gearExifAliases.normalizedBrand} IS NULL`,
      )
    : undefined;

  const conditions = [
    eq(gearExifAliases.modelNormalized, params.modelNormalized),
    params.makeNormalized
      ? eq(gearExifAliases.makeNormalized, params.makeNormalized)
      : undefined,
    brandCondition,
  ].filter(Boolean);

  return db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
    })
    .from(gearExifAliases)
    .innerJoin(gear, eq(gearExifAliases.gearId, gear.id))
    .where(and(...conditions));
}

export async function findGearExifAliasMatchesByModel(params: {
  modelNormalized: string | null;
  normalizedBrand: string | null;
}): Promise<GearExifAliasCandidate[]> {
  if (!params.modelNormalized) {
    return [];
  }

  const brandCondition = params.normalizedBrand
    ? or(
        eq(gearExifAliases.normalizedBrand, params.normalizedBrand),
        sql`${gearExifAliases.normalizedBrand} IS NULL`,
      )
    : undefined;

  return db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
    })
    .from(gearExifAliases)
    .innerJoin(gear, eq(gearExifAliases.gearId, gear.id))
    .where(
      and(
        eq(gearExifAliases.modelNormalized, params.modelNormalized),
        ...(brandCondition ? [brandCondition] : []),
      ),
    );
}

export async function findTrackedCameraPreviewByUserAndSerialHash(params: {
  userId: string;
  serialHash: string;
}): Promise<TrackedCameraPreview | null> {
  const trackedCameraRow = await db
    .select({
      id: exifTrackedCameras.id,
    })
    .from(exifTrackedCameras)
    .where(
      and(
        eq(exifTrackedCameras.userId, params.userId),
        eq(exifTrackedCameras.serialHash, params.serialHash),
      ),
    )
    .limit(1);

  const trackedCamera = trackedCameraRow[0];
  if (!trackedCamera) {
    return null;
  }

  return fetchTrackedCameraSummaryById({
    trackedCameraId: trackedCamera.id,
  });
}

export async function hasExifReadingByDedupeKey(dedupeKey: string) {
  const row = await db
    .select({
      id: exifShutterReadings.id,
    })
    .from(exifShutterReadings)
    .where(eq(exifShutterReadings.dedupeKey, dedupeKey))
    .limit(1);

  return Boolean(row[0]);
}

export async function upsertTrackedExifCamera(params: {
  userId: string;
  gearId: string | null;
  normalizedBrand: string | null;
  makeRaw: string | null;
  modelRaw: string | null;
  serialHash: string;
  seenAt: Date;
}) {
  return db.transaction(async (tx) => {
    const existingRow = await tx
      .select({
        id: exifTrackedCameras.id,
        gearId: exifTrackedCameras.gearId,
        normalizedBrand: exifTrackedCameras.normalizedBrand,
        makeRaw: exifTrackedCameras.makeRaw,
        modelRaw: exifTrackedCameras.modelRaw,
        firstSeenAt: exifTrackedCameras.firstSeenAt,
        lastSeenAt: exifTrackedCameras.lastSeenAt,
      })
      .from(exifTrackedCameras)
      .where(
        and(
          eq(exifTrackedCameras.userId, params.userId),
          eq(exifTrackedCameras.serialHash, params.serialHash),
        ),
      )
      .limit(1);

    let trackedCameraId = existingRow[0]?.id ?? null;
    const resolvedGearId = existingRow[0]?.gearId ?? params.gearId ?? null;

    if (!trackedCameraId) {
      const inserted = await tx
        .insert(exifTrackedCameras)
        .values({
          userId: params.userId,
          gearId: params.gearId,
          normalizedBrand: params.normalizedBrand,
          makeRaw: params.makeRaw,
          modelRaw: params.modelRaw,
          serialHash: params.serialHash,
          firstSeenAt: params.seenAt,
          lastSeenAt: params.seenAt,
        })
        .returning({
          id: exifTrackedCameras.id,
        });

      trackedCameraId = inserted[0]?.id ?? null;
    } else {
      const existing = existingRow[0]!;
      const firstSeenAt =
        existing.firstSeenAt && existing.firstSeenAt < params.seenAt
          ? existing.firstSeenAt
          : params.seenAt;
      const lastSeenAt =
        existing.lastSeenAt && existing.lastSeenAt > params.seenAt
          ? existing.lastSeenAt
          : params.seenAt;

      await tx
        .update(exifTrackedCameras)
        .set({
          gearId: resolvedGearId,
          normalizedBrand: existing.normalizedBrand ?? params.normalizedBrand,
          makeRaw: existing.makeRaw ?? params.makeRaw,
          modelRaw: existing.modelRaw ?? params.modelRaw,
          firstSeenAt,
          lastSeenAt,
          updatedAt: new Date(),
        })
        .where(eq(exifTrackedCameras.id, trackedCameraId));
    }

    if (!trackedCameraId) {
      throw new Error("Failed to persist tracked camera.");
    }

    return fetchTrackedCameraSummaryById({
      trackedCameraId,
      tx,
    });
  });
}

export async function persistTrackedExifReading(params: {
  trackedCameraId: string;
  dedupeKey: string;
  captureAt: Date | null;
  primaryCountType: ExifTrackingPrimaryCountType;
  primaryCountValue: number;
  shutterCount: number | null;
  totalShutterCount: number | null;
  mechanicalShutterCount: number | null;
  sourceTag: string | null;
  mechanicalSourceTag: string | null;
}) {
  return db.transaction(async (tx) => {
    await tx
      .insert(exifShutterReadings)
      .values({
        trackedCameraId: params.trackedCameraId,
        dedupeKey: params.dedupeKey,
        captureAt: params.captureAt,
        primaryCountType: params.primaryCountType,
        primaryCountValue: params.primaryCountValue,
        shutterCount: params.shutterCount,
        totalShutterCount: params.totalShutterCount,
        mechanicalShutterCount: params.mechanicalShutterCount,
        sourceTag: params.sourceTag,
        mechanicalSourceTag: params.mechanicalSourceTag,
      })
      .onConflictDoNothing({
        target: exifShutterReadings.dedupeKey,
      });

    const summary = await fetchTrackedCameraSummaryById({
      trackedCameraId: params.trackedCameraId,
      tx,
    });

    return summary;
  });
}

export async function fetchTrackedCameraHistoryById(params: {
  userId: string;
  trackedCameraId: string;
}): Promise<ExifTrackingHistoryResponse | null> {
  const trackedCameraRow = await db
    .select({
      id: exifTrackedCameras.id,
      gearId: exifTrackedCameras.gearId,
      modelRaw: exifTrackedCameras.modelRaw,
      firstSeenAt: exifTrackedCameras.firstSeenAt,
      lastSeenAt: exifTrackedCameras.lastSeenAt,
    })
    .from(exifTrackedCameras)
    .where(
      and(
        eq(exifTrackedCameras.id, params.trackedCameraId),
        eq(exifTrackedCameras.userId, params.userId),
      ),
    )
    .limit(1);

  const trackedCamera = trackedCameraRow[0];
  if (!trackedCamera) {
    return null;
  }

  const [summary, readings, matchedGear] = await Promise.all([
    fetchTrackedCameraSummaryById({
      trackedCameraId: trackedCamera.id,
    }),
    db
      .select({
        id: exifShutterReadings.id,
        captureAt: exifShutterReadings.captureAt,
        primaryCountType: exifShutterReadings.primaryCountType,
        primaryCountValue: exifShutterReadings.primaryCountValue,
        shutterCount: exifShutterReadings.shutterCount,
        totalShutterCount: exifShutterReadings.totalShutterCount,
        mechanicalShutterCount: exifShutterReadings.mechanicalShutterCount,
        createdAt: exifShutterReadings.createdAt,
      })
      .from(exifShutterReadings)
      .where(eq(exifShutterReadings.trackedCameraId, trackedCamera.id))
      .orderBy(
        sql`${exifShutterReadings.captureAt} DESC NULLS LAST`,
        desc(exifShutterReadings.createdAt),
      ),
    fetchMatchedGearById({
      gearId: trackedCamera.gearId,
    }),
  ]);

  const historyRows: ExifTrackedCameraHistoryEntry[] = readings.map((reading) => ({
    id: reading.id,
    captureAt: reading.captureAt?.toISOString() ?? null,
    primaryCountType: reading.primaryCountType,
    primaryCountValue: reading.primaryCountValue,
    shutterCount: reading.shutterCount,
    totalShutterCount: reading.totalShutterCount,
    mechanicalShutterCount: reading.mechanicalShutterCount,
    createdAt: reading.createdAt.toISOString(),
  }));

  return {
    ok: true,
    trackedCamera: {
      id: trackedCamera.id,
      title: matchedGear?.name ?? trackedCamera.modelRaw ?? "Tracked Camera",
      matchedGear,
      readingCount: summary?.trackedCamera.readingCount ?? historyRows.length,
      latestPrimaryCountValue:
        summary?.trackedCamera.latestPrimaryCountValue ?? null,
      latestCaptureAt: summary?.trackedCamera.latestCaptureAt ?? null,
      firstSeenAt: trackedCamera.firstSeenAt?.toISOString() ?? null,
      lastSeenAt: trackedCamera.lastSeenAt?.toISOString() ?? null,
    },
    readings: historyRows,
  };
}

export async function deleteTrackedExifReading(params: {
  userId: string;
  readingId: string;
}): Promise<DeleteTrackedExifReadingResult | null> {
  return db.transaction(async (tx) => {
    const readingRows = await tx
      .select({
        readingId: exifShutterReadings.id,
        trackedCameraId: exifTrackedCameras.id,
        gearId: exifTrackedCameras.gearId,
      })
      .from(exifShutterReadings)
      .innerJoin(
        exifTrackedCameras,
        eq(exifShutterReadings.trackedCameraId, exifTrackedCameras.id),
      )
      .where(
        and(
          eq(exifShutterReadings.id, params.readingId),
          eq(exifTrackedCameras.userId, params.userId),
        ),
      )
      .limit(1);

    const reading = readingRows[0];
    if (!reading) {
      return null;
    }

    const matchedGear = await fetchMatchedGearById({
      gearId: reading.gearId,
      tx,
    });

    await tx
      .delete(exifShutterReadings)
      .where(eq(exifShutterReadings.id, reading.readingId));

    const remainingRows = await tx
      .select({
        readingCount: count(),
      })
      .from(exifShutterReadings)
      .where(eq(exifShutterReadings.trackedCameraId, reading.trackedCameraId));

    const remainingCount = Number(remainingRows[0]?.readingCount ?? 0);

    if (remainingCount === 0) {
      await tx
        .delete(exifTrackedCameras)
        .where(eq(exifTrackedCameras.id, reading.trackedCameraId));

      return {
        deletedReadingId: reading.readingId,
        trackedCamera: null,
        matchedGear,
      };
    }

    await syncTrackedCameraSeenWindow({
      trackedCameraId: reading.trackedCameraId,
      tx,
    });

    const summary = await fetchTrackedCameraSummaryById({
      trackedCameraId: reading.trackedCameraId,
      tx,
    });

    return {
      deletedReadingId: reading.readingId,
      trackedCamera: summary?.trackedCamera ?? null,
      matchedGear: summary?.matchedGear ?? matchedGear,
    };
  });
}
