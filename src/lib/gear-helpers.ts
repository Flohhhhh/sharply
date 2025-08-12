import { db } from "~/server/db";
import { gear, brands, mounts } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export interface CurrentSpecs {
  core: {
    releaseDate: string | null | undefined;
    msrpUsdCents: number | null | undefined;
    mountId: string | null | undefined;
  };
  camera: Record<string, any>;
  lens: Record<string, any>;
}

/**
 * Fetches gear data by slug with related brand and mount information
 * Returns raw data for maximum reusability - let components transform as needed
 */
export async function fetchGearData(slug: string) {
  const gearItem = await db
    .select()
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(mounts, eq(gear.mountId, mounts.id))
    .where(eq(gear.slug, slug))
    .limit(1);

  if (!gearItem.length) {
    notFound();
  }

  return gearItem[0]!;
}
