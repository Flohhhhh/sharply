import { performFuzzySearchAdmin } from "~/server/admin/gear/service";

export interface FuzzySearchResult {
  id: string;
  name: string;
  slug: string;
}

export interface FuzzySearchParams {
  inputName: string;
  brandName: string;
  brandId: string;
}

/**
 * Performs fuzzy search for similar gear items within the same brand.
 * Excludes brand tokens, splits letter-digit boundaries, and requires all tokens to match.
 */
export async function performFuzzySearch(params: FuzzySearchParams): Promise<{
  results: FuzzySearchResult[];
  tokens: string[];
  normalized: string;
}> {
  // Delegate to server data layer
  const { inputName, brandName, brandId } = params;
  const res = await performFuzzySearchAdmin({ inputName, brandName, brandId });
  return res;
}

/**
 * Checks if fuzzy search results should block gear creation.
 * Returns null if no block, or error details if blocked.
 */
export function shouldBlockFuzzyResults(
  fuzzyResults: FuzzySearchResult[],
  force: boolean = false,
): null | {
  error: string;
  fuzzy: FuzzySearchResult[];
  tokens: string[];
  normalized: string;
} {
  if (force || fuzzyResults.length === 0) {
    return null;
  }

  return {
    error: "Similar items exist",
    fuzzy: fuzzyResults,
    tokens: fuzzyResults.length > 0 ? fuzzyResults.map((r) => r.name) : [],
    normalized: "",
  };
}
