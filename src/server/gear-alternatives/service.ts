import "server-only";

import { fetchGearAlternativesWithDetailsData } from "./data";
import type { GearAlternativeWithDetails } from "./data";

export type { GearAlternativeWithDetails };

/**
 * Fetch gear alternatives for display (public, no auth required)
 * Returns alternatives with full gear details for rendering cards
 */
export async function fetchGearAlternativesForDisplay(
  gearId: string,
): Promise<{
  competitors: GearAlternativeWithDetails[];
  adjacent: GearAlternativeWithDetails[];
}> {
  const alternatives = await fetchGearAlternativesWithDetailsData(gearId);

  // Separate into competitors and adjacent alternatives
  const competitors = alternatives.filter((alt) => alt.isDirectCompetitor);
  const adjacent = alternatives.filter((alt) => !alt.isDirectCompetitor);

  return { competitors, adjacent };
}
