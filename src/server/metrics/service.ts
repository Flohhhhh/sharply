import "server-only";

import {
  getGearCount as getGearCountData,
  getContributionCount as getContributionCountData,
} from "./data";

export async function fetchGearCount(): Promise<number> {
  return getGearCountData();
}

export async function fetchContributionCount(): Promise<number> {
  return getContributionCountData();
}
