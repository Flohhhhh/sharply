export interface FuzzySearchResult {
  id: string;
  name: string;
  slug: string;
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
