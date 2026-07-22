import "server-only";

import {
  getContributionCount as getContributionCountData,
  getGearCount as getGearCountData,
  getPublishedGearCountsByBrand as getPublishedGearCountsByBrandData,
} from "./data";

export async function fetchGearCount(): Promise<number> {
  return getGearCountData();
}

export async function fetchContributionCount(): Promise<number> {
  return getContributionCountData();
}

export async function fetchPublishedGearCountsByBrand(): Promise<
  Array<{ brandId: string; count: number }>
> {
  return getPublishedGearCountsByBrandData();
}
