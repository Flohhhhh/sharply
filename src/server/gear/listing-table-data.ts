import { eq, inArray } from "drizzle-orm";
import "server-only";
import { db } from "~/server/db";
import {
  cameraSpecs,
  gear,
  gearMounts,
  lensSpecs,
  mounts,
  sensorFormats,
} from "~/server/db/schema";

export type GearListingTableFields = {
  mountNames: string[];
  sensorFormatName: string | null;
  weightGrams: number | null;
  focalLengthMinMm: number | null;
  focalLengthMaxMm: number | null;
  isPrime: boolean | null;
  maxApertureWide: number | null;
  maxApertureTele: number | null;
};

function toNullableNumber(value: number | string | null) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchGearListingTableFields(gearIds: string[]) {
  if (!gearIds.length) return new Map<string, GearListingTableFields>();

  const rows = await db
    .select({
      gearId: gear.id,
      mountName: mounts.value,
      sensorFormatName: sensorFormats.name,
      weightGrams: gear.weightGrams,
      focalLengthMinMm: lensSpecs.focalLengthMinMm,
      focalLengthMaxMm: lensSpecs.focalLengthMaxMm,
      isPrime: lensSpecs.isPrime,
      maxApertureWide: lensSpecs.maxApertureWide,
      maxApertureTele: lensSpecs.maxApertureTele,
    })
    .from(gear)
    .leftJoin(gearMounts, eq(gear.id, gearMounts.gearId))
    .leftJoin(mounts, eq(gearMounts.mountId, mounts.id))
    .leftJoin(cameraSpecs, eq(gear.id, cameraSpecs.gearId))
    .leftJoin(sensorFormats, eq(cameraSpecs.sensorFormatId, sensorFormats.id))
    .leftJoin(lensSpecs, eq(gear.id, lensSpecs.gearId))
    .where(inArray(gear.id, gearIds));

  const result = new Map<string, GearListingTableFields>();
  for (const row of rows) {
    const existing = result.get(row.gearId);
    if (existing) {
      if (row.mountName && !existing.mountNames.includes(row.mountName)) {
        existing.mountNames.push(row.mountName);
      }
      continue;
    }
    result.set(row.gearId, {
      mountNames: row.mountName ? [row.mountName] : [],
      sensorFormatName: row.sensorFormatName ?? null,
      weightGrams: row.weightGrams ?? null,
      focalLengthMinMm: row.focalLengthMinMm ?? null,
      focalLengthMaxMm: row.focalLengthMaxMm ?? null,
      isPrime: row.isPrime ?? null,
      maxApertureWide: toNullableNumber(row.maxApertureWide),
      maxApertureTele: toNullableNumber(row.maxApertureTele),
    });
  }

  for (const fields of result.values()) {
    fields.mountNames.sort((left, right) => left.localeCompare(right));
  }
  return result;
}
