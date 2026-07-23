import "server-only";
import {
  fetchGearListingTableFields,
  type GearListingTableFields,
} from "./listing-table-data";

const EMPTY_GEAR_LISTING_TABLE_FIELDS: GearListingTableFields = {
  mountNames: [],
  sensorFormatName: null,
  weightGrams: null,
  focalLengthMinMm: null,
  focalLengthMaxMm: null,
  isPrime: null,
  maxApertureWide: null,
  maxApertureTele: null,
};

export async function attachGearListingTableFields<T extends { id: string }>(
  items: T[],
): Promise<Array<T & GearListingTableFields>> {
  const fieldsByGearId = await fetchGearListingTableFields(
    items.map((item) => item.id),
  );

  return items.map((item) => ({
    ...item,
    ...(fieldsByGearId.get(item.id) ?? EMPTY_GEAR_LISTING_TABLE_FIELDS),
  }));
}
