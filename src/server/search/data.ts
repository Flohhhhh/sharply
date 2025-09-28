// In Next.js runtime, enforce server-only import. In scripts (Node), skip.
if (process.env.NEXT_RUNTIME) {
  import("server-only").catch(() => {
    console.warn("[search:data] server-only import failed, skipping.");
  });
}

/**
 * Search Data Layer (server-only)
 *
 * Responsibilities:
 * - Provide pure SQL builders (expressions) and raw DB query functions.
 * - No auth, no caching, no request/response shaping.
 * - Reusable by service.ts (or other server modules) to compose higher-level operations.
 *
 * Structure:
 * - buildSearchWhereClause: builds a strict WHERE clause for free-text queries.
 * - buildRelevanceExpr: ranks results using a weighted GREATEST(...) expression.
 * - querySearchRows / querySearchTotal: run the core search select + count.
 * - queryGearSuggestions / queryBrandSuggestions: lighter-weight suggestion queries.
 */

import { db } from "~/server/db";
import { gear, brands, mounts } from "~/server/db/schema";
import { asc, desc, ilike, sql, and, type SQL } from "drizzle-orm";

/**
 * Build a strict WHERE clause for free-text search.
 * - Normalizes input (case-insensitive, punctuation-insensitive).
 * - Requires multiple strong token matches when present to reduce overmatching.
 * - Combines brand-agnostic and normalized contains with conservative fuzzy thresholds.
 */
export function buildSearchWhereClause(query: string): SQL | undefined {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedQueryNoPunct = normalizedQuery.replace(/[\s\-_.]+/g, "");

  const parts = normalizedQuery
    .split(/[\s_]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.trim());
  if (parts.length === 0) return undefined;

  const strongParts = parts.filter((p) => /[a-z]/i.test(p) && p.length >= 3);

  const searchLower = sql`lower(${gear.searchName})`;
  const normalizedCol = sql`regexp_replace(${searchLower}, '[[:space:]_.-]+', '', 'g')`;
  const brandLower = sql`lower(${brands.name})`;
  const noBrand = sql`replace(${searchLower}, ${brandLower}, '')`;
  const normalizedNoBrand = sql`regexp_replace(${noBrand}, '[[:space:]_.-]+', '', 'g')`;

  const conditions: SQL[] = [];
  if (strongParts.length >= 2) {
    const partMatches = strongParts.map(
      (part) =>
        sql`CASE WHEN ${ilike(gear.searchName, `%${part}%`)} THEN 1 ELSE 0 END`,
    );
    const sumMatches = sql`(${sql.join(partMatches, sql` + `)})`;
    conditions.push(sql`${sumMatches} >= 2`);
  } else if (strongParts.length === 1) {
    conditions.push(ilike(gear.searchName, `%${strongParts[0]}%`));
  }

  conditions.push(sql`${normalizedCol} ILIKE ${`%${normalizedQueryNoPunct}%`}`);
  conditions.push(
    sql`${normalizedNoBrand} ILIKE ${`%${normalizedQueryNoPunct}%`}`,
  );
  conditions.push(
    sql`similarity(${normalizedNoBrand}, ${normalizedQueryNoPunct}) > 0.4`,
  );
  conditions.push(
    sql`similarity(${gear.searchName}, ${normalizedQueryNoPunct}) > 0.5`,
  );

  // Minimal numeric-combo support: if query contains at least two numeric tokens
  // (integers with length >= 3 or decimals like 4.5), require ALL to appear
  // somewhere in the raw search name. This helps queries like "400 4.5" match
  // lenses named "400mm f/4.5" even when normalized concatenation breaks adjacency.
  const numericMatches = Array.from(
    normalizedQuery.matchAll(/\d+(?:\.\d+)?/g),
  ).map((m) => m[0]);
  const numericTokens = numericMatches.filter(
    (t) => t.includes(".") || t.length >= 3,
  );
  if (numericTokens.length >= 2) {
    const andClauses = numericTokens.map((t) =>
      ilike(gear.searchName, `%${t}%`),
    );
    conditions.push(
      sql`(${sql.join(andClauses as unknown as SQL[], sql` AND `)})`,
    );
  }

  return sql`(${sql.join(conditions, sql` OR `)})`;
}

/**
 * Construct a relevance expression used for ranking (higher is better).
 * Weights prefer exact/normalized contains over fuzzy similarity.
 */
export function buildRelevanceExpr(
  query: string,
  normalizedQueryNoPunct: string,
) {
  const searchLower = sql`lower(${gear.searchName})`;
  const normalizedCol = sql`regexp_replace(${searchLower}, '[[:space:]_.-]+', '', 'g')`;
  const brandLower = sql`lower(${brands.name})`;
  const noBrand = sql`replace(${searchLower}, ${brandLower}, '')`;
  const normalizedNoBrand = sql`regexp_replace(${noBrand}, '[[:space:]_.-]+', '', 'g')`;
  return sql<number>`GREATEST(
    CASE WHEN ${searchLower} ILIKE ${`%${query.toLowerCase().trim()}%`} THEN 2.0 ELSE 0 END,
    CASE WHEN ${normalizedCol} ILIKE ${`%${normalizedQueryNoPunct}%`} THEN 1.8 ELSE 0 END,
    CASE WHEN ${normalizedNoBrand} ILIKE ${`%${normalizedQueryNoPunct}%`} THEN 1.0 ELSE 0 END,
    similarity(${normalizedNoBrand}, ${normalizedQueryNoPunct}) * 0.6,
    similarity(${normalizedCol}, ${normalizedQueryNoPunct}) * 0.4,
    similarity(${gear.searchName}, ${normalizedQueryNoPunct}) * 0.3
  )`;
}

/**
 * Execute the core search SELECT using the provided whereClause/orderBy/pagination.
 * Optionally includes a computed relevance column when supplied.
 */
export async function querySearchRows(options: {
  whereClause?: SQL;
  orderBy: any[];
  pageSize: number;
  offset: number;
  relevanceExpr?: any;
}) {
  return db
    .select({
      id: gear.id,
      name: gear.name,
      slug: gear.slug,
      brandName: brands.name,
      mountValue: mounts.value,
      gearType: gear.gearType,
      thumbnailUrl: gear.thumbnailUrl,
      ...(options.relevanceExpr && { relevance: options.relevanceExpr }),
    })
    .from(gear)
    .leftJoin(brands, sql`${gear.brandId} = ${brands.id}`)
    .leftJoin(mounts, sql`${gear.mountId} = ${mounts.id}`)
    .where(options.whereClause)
    .orderBy(...options.orderBy)
    .limit(options.pageSize)
    .offset(options.offset);
}

/**
 * Execute the COUNT(*) for the current search constraints.
 */
export async function querySearchTotal(whereClause?: SQL) {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(gear)
    .leftJoin(brands, sql`${gear.brandId} = ${brands.id}`)
    .leftJoin(mounts, sql`${gear.mountId} = ${mounts.id}`)
    .where(whereClause);
  return Number(rows[0]?.count ?? 0);
}

/**
 * Suggest top gear for a partial query using the given where clause and ranking.
 */
export async function queryGearSuggestions(
  whereClause: SQL,
  relevanceExpr: any,
) {
  return db
    .select({
      id: gear.id,
      name: gear.name,
      slug: gear.slug,
      brandName: brands.name,
      relevance: relevanceExpr,
    })
    .from(gear)
    .leftJoin(brands, sql`${gear.brandId} = ${brands.id}`)
    .where(whereClause)
    .orderBy(desc(relevanceExpr), asc(gear.name))
    .limit(5);
}

/**
 * Suggest brands by similarity to the raw normalized input string.
 */
export async function queryBrandSuggestions(normalizedQuery: string) {
  return db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      relevance: sql<number>`similarity(${brands.name}, ${normalizedQuery})`,
    })
    .from(brands)
    .where(ilike(brands.name, `%${normalizedQuery}%`))
    .orderBy(sql`similarity(${brands.name}, ${normalizedQuery}) DESC`)
    .limit(3);
}
