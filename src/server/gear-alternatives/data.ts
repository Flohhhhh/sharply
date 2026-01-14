import "server-only";

import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { gearAlternatives, gear, brands } from "~/server/db/schema";

export interface GearAlternativeWithDetails {
  gearId: string;
  alternativeGearId: string;
  isDirectCompetitor: boolean;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  brandId: string;
  brandName: string | null;
  brandSlug: string | null;
  gearType: string | null;
  releaseDate: Date | null;
  releaseDatePrecision: string | null;
}

/**
 * Fetch gear alternatives with full details for display
 */
export async function fetchGearAlternativesWithDetailsData(
  gearId: string,
): Promise<GearAlternativeWithDetails[]> {
  const results = await db
    .select({
      gearId: gearAlternatives.gearId,
      alternativeGearId: gearAlternatives.alternativeGearId,
      isDirectCompetitor: gearAlternatives.isDirectCompetitor,
      slug: gear.slug,
      name: gear.name,
      thumbnailUrl: gear.thumbnailUrl,
      brandId: gear.brandId,
      brandName: brands.name,
      brandSlug: brands.slug,
      gearType: gear.gearType,
      releaseDate: gear.releaseDate,
      releaseDatePrecision: gear.releaseDatePrecision,
    })
    .from(gearAlternatives)
    .innerJoin(gear, eq(gearAlternatives.alternativeGearId, gear.id))
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .where(eq(gearAlternatives.gearId, gearId));

  return results;
}
