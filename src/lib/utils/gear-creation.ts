import { and, ilike, eq } from "drizzle-orm";
import { gear } from "~/server/db/schema";
import { normalizeSearchName } from "~/lib/utils";

export interface FuzzySearchResult {
  id: string;
  name: string;
  slug: string;
}

export interface FuzzySearchParams {
  inputName: string;
  brandName: string;
  brandId: string;
  db: any; // Drizzle database instance
}

/**
 * Performs fuzzy search for similar gear items within the same brand.
 * Excludes brand tokens, splits letter-digit boundaries, and requires all tokens to match.
 */
export async function performFuzzySearch({
  inputName,
  brandName,
  brandId,
  db,
}: FuzzySearchParams): Promise<{
  results: FuzzySearchResult[];
  tokens: string[];
  normalized: string;
}> {
  const normalized = normalizeSearchName(inputName, brandName);

  // Sanitize and tokenize input, excluding brand tokens
  const sanitize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const brandTokenSet = new Set(
    sanitize(brandName).split(/\s+/).filter(Boolean),
  );

  const rawTokens = sanitize(inputName)
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !brandTokenSet.has(t));

  // Expand tokens at letter-digit boundaries (e.g., "z6iii" -> ["z", "6", "iii"])
  const expanded: string[] = [];
  for (const t of rawTokens) {
    const parts = t.match(/[a-z]+|\d+/gi) || [];
    for (const p of parts) {
      if (p.length >= 2 || /\d+/.test(p)) expanded.push(p);
    }
  }

  const tokensForMatch = expanded.length > 0 ? expanded : rawTokens;

  if (tokensForMatch.length === 0) {
    return { results: [], tokens: [], normalized };
  }

  // Perform AND search requiring all tokens to match
  const andParts = tokensForMatch.map((t) => ilike(gear.searchName, `%${t}%`));

  const results = await db
    .select({ id: gear.id, name: gear.name, slug: gear.slug })
    .from(gear)
    .where(and(eq(gear.brandId, brandId), ...andParts))
    .limit(10);

  return {
    results,
    tokens: tokensForMatch,
    normalized,
  };
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
