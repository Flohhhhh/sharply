import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { gearAlternatives, gear } from "~/server/db/schema";

export interface GearAlternative {
  gearId: string;
  alternativeGearId: string;
  isDirectCompetitor: boolean;
  alternativeName: string;
  alternativeSlug: string;
  alternativeThumbnailUrl: string | null;
  alternativeBrandId: string;
}

export async function fetchGearAlternativesData(
  gearId: string,
): Promise<GearAlternative[]> {
  const results = await db
    .select({
      gearId: gearAlternatives.gearId,
      alternativeGearId: gearAlternatives.alternativeGearId,
      isDirectCompetitor: gearAlternatives.isDirectCompetitor,
      alternativeName: gear.name,
      alternativeSlug: gear.slug,
      alternativeThumbnailUrl: gear.thumbnailUrl,
      alternativeBrandId: gear.brandId,
    })
    .from(gearAlternatives)
    .innerJoin(gear, eq(gearAlternatives.alternativeGearId, gear.id))
    .where(eq(gearAlternatives.gearId, gearId));

  return results;
}

export async function addGearAlternativeData(params: {
  gearId: string;
  alternativeGearId: string;
  isDirectCompetitor: boolean;
}): Promise<void> {
  await db.insert(gearAlternatives).values({
    gearId: params.gearId,
    alternativeGearId: params.alternativeGearId,
    isDirectCompetitor: params.isDirectCompetitor,
    createdAt: new Date(),
  });
}

export async function removeGearAlternativeData(params: {
  gearId: string;
  alternativeGearId: string;
}): Promise<void> {
  await db
    .delete(gearAlternatives)
    .where(
      and(
        eq(gearAlternatives.gearId, params.gearId),
        eq(gearAlternatives.alternativeGearId, params.alternativeGearId),
      ),
    );
}

export async function updateGearAlternativeData(params: {
  gearId: string;
  alternativeGearId: string;
  isDirectCompetitor: boolean;
}): Promise<void> {
  await db
    .update(gearAlternatives)
    .set({
      isDirectCompetitor: params.isDirectCompetitor,
    })
    .where(
      and(
        eq(gearAlternatives.gearId, params.gearId),
        eq(gearAlternatives.alternativeGearId, params.alternativeGearId),
      ),
    );
}
