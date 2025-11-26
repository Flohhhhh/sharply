import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import { cameraVideoModes } from "~/server/db/schema";

export type CameraVideoModeRow = typeof cameraVideoModes.$inferSelect;
export type CameraVideoModeInsert = typeof cameraVideoModes.$inferInsert;

export async function fetchVideoModesByGearId(
  gearId: string,
): Promise<CameraVideoModeRow[]> {
  return db
    .select()
    .from(cameraVideoModes)
    .where(eq(cameraVideoModes.gearId, gearId))
    .orderBy(
      asc(cameraVideoModes.resolutionKey),
      asc(cameraVideoModes.fps),
      asc(cameraVideoModes.codecLabel),
    );
}

export async function fetchVideoModesByGearIds(
  gearIds: string[],
): Promise<Record<string, CameraVideoModeRow[]>> {
  if (gearIds.length === 0) return {};
  const rows = await db
    .select()
    .from(cameraVideoModes)
    .where(inArray(cameraVideoModes.gearId, gearIds))
    .orderBy(
      asc(cameraVideoModes.gearId),
      asc(cameraVideoModes.resolutionKey),
      asc(cameraVideoModes.fps),
      asc(cameraVideoModes.codecLabel),
    );

  return rows.reduce<Record<string, CameraVideoModeRow[]>>((acc, row) => {
    if (!acc[row.gearId]) acc[row.gearId] = [];
    acc[row.gearId]?.push(row);
    return acc;
  }, {});
}

export async function replaceVideoModesForGear(
  gearId: string,
  modes: CameraVideoModeInsert[],
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(cameraVideoModes)
      .where(eq(cameraVideoModes.gearId, gearId));
    if (!modes.length) return;
    await tx.insert(cameraVideoModes).values(
      modes.map((mode) => ({
        ...mode,
        gearId,
      })),
    );
  });
}

