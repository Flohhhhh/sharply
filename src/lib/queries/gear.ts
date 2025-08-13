import { db } from "~/server/db";
import {
  gear,
  brands,
  mounts,
  cameraSpecs,
  lensSpecs,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { GearItem } from "~/types/gear";

/**
 * Fetches gear data by slug with related brand and mount information
 * Returns raw data for maximum reusability - let components transform as needed
 */
export async function fetchGearBySlug(slug: string): Promise<GearItem> {
  let result: GearItem;

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

  // if gear type is CAMERA, return the camera specs
  if (gearItem[0]!.gear.gearType === "CAMERA") {
    const camera = await db
      .select()
      .from(cameraSpecs)
      .where(eq(cameraSpecs.gearId, gearItem[0]!.gear.id));

    result = {
      ...gearItem[0]!.gear,
      lensSpecs: null,
      cameraSpecs: camera[0],
    };
  }

  // if gear type is LENS, return the lens specs
  if (gearItem[0]!.gear.gearType === "LENS") {
    const lens = await db
      .select()
      .from(lensSpecs)
      .where(eq(lensSpecs.gearId, gearItem[0]!.gear.id));

    result = {
      ...gearItem[0]!.gear,
      cameraSpecs: null,
      lensSpecs: lens[0],
    };
  }

  // if gear type is not CAMERA or LENS, return the gear item
  result = {
    ...gearItem[0]!.gear,
    cameraSpecs: null,
    lensSpecs: null,
  };

  return result;
}
