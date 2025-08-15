import { db } from "~/server/db";
import { gear, brands, mounts } from "~/server/db/schema";
import { asc, desc, ilike, sql } from "drizzle-orm";

/**
 * Search strategy overview
 *
 * Goals
 * - Be tolerant to punctuation/spacing (e.g., "Z6III" vs "Z6 III", "70-200" vs "70200")
 * - Avoid over-matching by brand (brand should not dominate results)
 * - Keep short/weak tokens (e.g., "70") from widening results too much
 * - Use pg_trgm similarity for ranking, not as the only gate
 *
 * Tactics
 * - Normalize both the user query and DB fields by stripping spaces, underscores, dots and hyphens
 * - Build a brand-agnostic column by removing the brand from `search_name` before normalization
 * - Only use substring ILIKE for tokens that contain letters and are at least 3 chars long
 *   (prevents numeric fragments like "70" from matching everything)
 * - Gate fuzzy matches with conservative similarity thresholds
 */
export type SearchSort = "relevance" | "name" | "newest";

export type SearchFilters = {
  brand?: string;
  mount?: string;
  gearType?: string;
  priceMin?: number;
  priceMax?: number;
  sensorFormat?: string;
};

export type SearchParams = {
  query?: string;
  sort: SearchSort;
  page: number;
  pageSize: number;
  filters?: SearchFilters;
};

export type SearchResult = {
  id: string;
  name: string;
  slug: string;
  brandName: string | null;
  mountValue: string | null;
  gearType: string;
  thumbnailUrl: string | null;
  relevance?: number;
};

export type SearchResponse = {
  results: SearchResult[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

/**
 * Build the WHERE clause for search.
 *
 * Why it's structured this way:
 * - We keep hyphens when tokenizing (split only on spaces/underscores) so "70-200" stays whole.
 * - We still match a normalized no-punctuation version so "70-200" ↔ "70200" works.
 * - We filter substring tokens to only strong tokens (letters and length ≥ 3).
 * - Similarity matches are brand-agnostic and gated with conservative thresholds.
 */
function buildSearchWhereClause(query: string) {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedQueryNoPunct = normalizedQuery.replace(/[\s\-_.]+/g, "");

  // Tokenize by spaces/underscores only; do NOT split on hyphens.
  const parts = normalizedQuery
    .split(/[\s_]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.trim());

  if (parts.length === 0) return undefined;

  // Only use letter-containing tokens of length ≥ 3 for substring ILIKE matching.
  const strongParts = parts.filter((p) => /[a-z]/i.test(p) && p.length >= 3);

  // Column expressions
  const searchLower = sql`lower(${gear.searchName})`;
  const normalizedCol = sql`regexp_replace(${searchLower}, '[[:space:]_.-]+', '', 'g')`;
  const brandLower = sql`lower(${brands.name})`;
  // Remove brand token from search name using simple replace (brand and search both lowercased)
  const noBrand = sql`replace(${searchLower}, ${brandLower}, '')`;
  const normalizedNoBrand = sql`regexp_replace(${noBrand}, '[[:space:]_.-]+', '', 'g')`;

  // Build search conditions with stricter requirements
  const conditions = [];

  // For queries with multiple strong parts, require at least 2 matches
  if (strongParts.length >= 2) {
    // Create a condition that requires at least 2 strong parts to match
    const partMatches = strongParts.map(
      (part) =>
        sql`CASE WHEN ${ilike(gear.searchName, `%${part}%`)} THEN 1 ELSE 0 END`,
    );
    const sumMatches = sql`(${sql.join(partMatches, sql` + `)})`;
    conditions.push(sql`${sumMatches} >= 2`);
  } else if (strongParts.length === 1) {
    // Single strong part - use it directly
    conditions.push(ilike(gear.searchName, `%${strongParts[0]}%`));
  }

  // Normalized contains checks (more restrictive)
  conditions.push(sql`${normalizedCol} ILIKE ${`%${normalizedQueryNoPunct}%`}`);
  conditions.push(
    sql`${normalizedNoBrand} ILIKE ${`%${normalizedQueryNoPunct}%`}`,
  );

  // Fuzzy fallbacks with higher thresholds
  conditions.push(
    sql`similarity(${normalizedNoBrand}, ${normalizedQueryNoPunct}) > 0.4`,
  );
  conditions.push(
    sql`similarity(${gear.searchName}, ${normalizedQueryNoPunct}) > 0.5`,
  );

  return sql`(${sql.join(conditions, sql` OR `)})`;
}

/**
 * Full search with filters, pagination, and sort options.
 * Returns results with an optional `relevance` score (0..1) when sort = "relevance".
 */
export async function searchGear(
  params: SearchParams,
): Promise<SearchResponse> {
  const { query, sort, page, pageSize, filters } = params;
  const offset = (page - 1) * pageSize;

  // Build where clause
  let whereClause = undefined;
  let normalizedQueryNoPunct: string | null = null;
  if (query && query.trim().length > 0) {
    whereClause = buildSearchWhereClause(query);
    normalizedQueryNoPunct = query
      .toLowerCase()
      .trim()
      .replace(/[\s\-_.]+/g, "");
  }

  // Optional filters
  if (filters) {
    const filterConditions = [] as any[];
    if (filters.brand) {
      filterConditions.push(sql`${brands.name} ILIKE ${`%${filters.brand}%`}`);
    }
    if (filters.mount) {
      filterConditions.push(sql`${mounts.value} ILIKE ${`%${filters.mount}%`}`);
    }
    if (filters.gearType) {
      filterConditions.push(sql`${gear.gearType} = ${filters.gearType}`);
    }
    if (filters.priceMin !== undefined) {
      filterConditions.push(
        sql`${gear.msrpUsdCents} >= ${filters.priceMin * 100}`,
      );
    }
    if (filters.priceMax !== undefined) {
      filterConditions.push(
        sql`${gear.msrpUsdCents} <= ${filters.priceMax * 100}`,
      );
    }

    if (filterConditions.length > 0) {
      const filterClause = sql`(${sql.join(filterConditions, sql` AND `)})`;
      whereClause = whereClause
        ? sql`(${whereClause}) AND (${filterClause})`
        : filterClause;
    }
  }

  // Relevance ranking – emphasizes brand-agnostic normalized similarity and exact normalized contains.
  const searchLower = sql`lower(${gear.searchName})`;
  const normalizedCol = sql`regexp_replace(${searchLower}, '[[:space:]_.-]+', '', 'g')`;
  const brandLower = sql`lower(${brands.name})`;
  const noBrand = sql`replace(${searchLower}, ${brandLower}, '')`;
  const normalizedNoBrand = sql`regexp_replace(${noBrand}, '[[:space:]_.-]+', '', 'g')`;

  const relevanceExpr = query
    ? sql<number>`GREATEST(
        -- Exact matches get highest priority
        CASE WHEN ${searchLower} ILIKE ${`%${query.toLowerCase().trim()}%`} THEN 2.0 ELSE 0 END,
        
        -- Normalized exact matches (handles punctuation differences)
        CASE WHEN ${normalizedCol} ILIKE ${`%${normalizedQueryNoPunct}%`} THEN 1.8 ELSE 0 END,
        
        -- Brand-agnostic normalized matches (lower priority)
        CASE WHEN ${normalizedNoBrand} ILIKE ${`%${normalizedQueryNoPunct}%`} THEN 1.0 ELSE 0 END,
        
        -- Fuzzy similarity with lower weights
        similarity(${normalizedNoBrand}, ${normalizedQueryNoPunct}) * 0.6,
        similarity(${normalizedCol}, ${normalizedQueryNoPunct}) * 0.4,
        similarity(${gear.searchName}, ${normalizedQueryNoPunct}) * 0.3
      )`
    : sql<number>`0`;

  // Sorting
  let orderBy;
  if (query && sort === "relevance") {
    orderBy = [desc(relevanceExpr), asc(gear.name)];
  } else if (sort === "newest") {
    orderBy = [desc(gear.releaseDate), asc(gear.name)];
  } else {
    orderBy = [asc(gear.name)];
  }

  // Execute search
  const rows = await db
    .select({
      id: gear.id,
      name: gear.name,
      slug: gear.slug,
      brandName: brands.name,
      mountValue: mounts.value,
      gearType: gear.gearType,
      thumbnailUrl: gear.thumbnailUrl,
      ...(query && sort === "relevance" && { relevance: relevanceExpr }),
    })
    .from(gear)
    .leftJoin(brands, sql`${gear.brandId} = ${brands.id}`)
    .leftJoin(mounts, sql`${gear.mountId} = ${mounts.id}`)
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset(offset);

  // Get total count
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(gear)
    .leftJoin(brands, sql`${gear.brandId} = ${brands.id}`)
    .leftJoin(mounts, sql`${gear.mountId} = ${mounts.id}`)
    .where(whereClause);

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    results: rows,
    total,
    totalPages,
    page,
    pageSize,
  };
}
