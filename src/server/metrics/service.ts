import "server-only";

import {
  getContributionCount as getContributionCountData,
  getGearCount as getGearCountData,
} from "./data";

export async function fetchGearCount(): Promise<number> {
  return getGearCountData();
}

export async function fetchContributionCount(): Promise<number> {
  return getContributionCountData();
}
