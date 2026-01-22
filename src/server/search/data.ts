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
import {
  gear,
  brands,
  mounts,
  gearMounts,
  cameraSpecs,
  sensorFormats,
  lensSpecs,
  fixedLensSpecs,
  analogCameraSpecs,
} from "~/server/db/schema";
import { asc, desc, ilike, sql, and, eq, type SQL } from "drizzle-orm";

/**
 * Build a strict WHERE clause for free-text search.
 * - Normalizes input (case-insensitive, punctuation-insensitive).
 * - Requires multiple strong token matches when present to reduce overmatching.
 * - Combines brand-agnostic and normalized contains with conservative fuzzy thresholds.
 */
export function buildSearchWhereClause(query: string): SQL | undefined {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedQueryNoPunct = normalizedQuery.replace(/[\s\-_.\/]+/g, "");

  const parts = normalizedQuery
    .split(/[\s_]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.trim());
  if (parts.length === 0) return undefined;

  const strongParts = parts.filter((p) => /[a-z]/i.test(p) && p.length >= 3);

  const searchLower = sql`lower(${gear.searchName})`;
  const normalizedCol = sql`regexp_replace(${searchLower}, '[[:space:]_.\/-]+', '', 'g')`;
  const brandLower = sql`lower(${brands.name})`;
  const noBrand = sql`replace(${searchLower}, ${brandLower}, '')`;
  // For Nikon items, also strip a leading "nikkor" word to avoid penalizing
  // users who search without it (common behavior: they type "nikon z 400 4.5").
  const noBrandWithSynonyms = sql`CASE WHEN ${brandLower} = 'nikon' THEN regexp_replace(${noBrand}, '^\\s*nikkor\\s+', '', 'g') ELSE ${noBrand} END`;
  const normalizedNoBrand = sql`regexp_replace(${noBrandWithSynonyms}, '[[:space:]_.\/-]+', '', 'g')`;

  // Also remove the detected brand (and Nikon's "nikkor") from the QUERY side
  // when matching against brand-stripped columns, so queries that omit
  // product-line terms don't get penalized.
  const queryNormSql = sql`${normalizedQueryNoPunct}`;
  const queryNoBrand = sql`regexp_replace(${queryNormSql}, ${brandLower}, '', 'gi')`;
  const queryNoBrandWithSynonyms = sql`CASE WHEN ${brandLower} = 'nikon' THEN regexp_replace(${queryNoBrand}, 'nikkor', '', 'gi') ELSE ${queryNoBrand} END`;

  // Lens-relaxed normalization: remove domain-specific glue between numbers
  // - "mm" after a digit (e.g., 400mm -> 400)
  // - leading "f" before a digit (e.g., f4.5 -> 4.5)
  const normalizedNoBrandRelaxedStep1 = sql`regexp_replace(${normalizedNoBrand}, '([0-9])mm', '\\1', 'gi')`;
  const normalizedNoBrandRelaxed = sql`regexp_replace(${normalizedNoBrandRelaxedStep1}, 'f([0-9])', '\\1', 'gi')`;
  const normalizedColRelaxedStep1 = sql`regexp_replace(${normalizedCol}, '([0-9])mm', '\\1', 'gi')`;
  const normalizedColRelaxed = sql`regexp_replace(${normalizedColRelaxedStep1}, 'f([0-9])', '\\1', 'gi')`;

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
    sql`${normalizedNoBrand} ILIKE ('%' || ${queryNoBrandWithSynonyms} || '%')`,
  );
  // Relaxed contains to tolerate omitted "mm"/"f" in user queries
  conditions.push(
    sql`${normalizedNoBrandRelaxed} ILIKE ('%' || ${queryNoBrandWithSynonyms} || '%')`,
  );
  conditions.push(
    sql`${normalizedColRelaxed} ILIKE ${`%${normalizedQueryNoPunct}%`}`,
  );
  conditions.push(
    sql`similarity(${normalizedNoBrand}, ${normalizedQueryNoPunct}) > 0.4`,
  );
  conditions.push(
    sql`similarity(${gear.searchName}, ${normalizedQueryNoPunct}) > 0.5`,
  );

  // Numeric token handling
  // - If there are 2+ numeric tokens (e.g., "400 4.5"), require ALL of them
  //   to appear in the raw search name (AND). This is appended to the OR set
  //   to avoid over-broad fuzzy matches.
  // - If there is exactly 1 significant numeric token (e.g., "400") AND the
  //   query also contains at least one alphabetic "strong" token (e.g., "nikon"),
  //   gate the whole match on that numeric token appearing as well. This helps
  //   queries like "nikon z 400" surface the corresponding 400mm lenses instead
  //   of only camera bodies.
  const numericMatches = Array.from(
    normalizedQuery.matchAll(/\d+(?:\.\d+)?/g),
  ).map((m) => m[0]);
  const numericTokens = numericMatches.filter(
    (t) => t.includes(".") || t.length >= 3,
  );

  // Make numeric tokens contribute positively to OR conditions as well.
  // This helps lens queries like "50 1.8" where punctuation/letters (e.g., "f/")
  // in names would otherwise break contiguous substring matches.
  if (numericTokens.length >= 2) {
    const andClauses = numericTokens.map((t) =>
      ilike(gear.searchName, `%${t}%`),
    );
    const numericAndForOr = sql`(${sql.join(andClauses as unknown as SQL[], sql` AND `)})`;
    conditions.push(numericAndForOr);
  } else if (numericTokens.length === 1) {
    conditions.push(ilike(gear.searchName, `%${numericTokens[0]}%`));
  }

  const baseOr = sql`(${sql.join(conditions, sql` OR `)})`;

  if (numericTokens.length >= 2) {
    const andClauses = numericTokens.map((t) =>
      ilike(gear.searchName, `%${t}%`),
    );
    const numericAnd = sql`(${sql.join(andClauses as unknown as SQL[], sql` AND `)})`;
    return sql`(${baseOr}) AND (${numericAnd})`;
  }

  if (numericTokens.length === 1 && strongParts.length >= 1) {
    const singleNumeric = ilike(gear.searchName, `%${numericTokens[0]}%`);
    return sql`(${baseOr}) AND (${singleNumeric})`;
  }

  return baseOr;
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
  const normalizedCol = sql`regexp_replace(${searchLower}, '[[:space:]_.\/-]+', '', 'g')`;
  const brandLower = sql`lower(${brands.name})`;
  const noBrand = sql`replace(${searchLower}, ${brandLower}, '')`;
  const noBrandWithSynonyms = sql`CASE WHEN ${brandLower} = 'nikon' THEN regexp_replace(${noBrand}, '^\\s*nikkor\\s+', '', 'g') ELSE ${noBrand} END`;
  const normalizedNoBrand = sql`regexp_replace(${noBrandWithSynonyms}, '[[:space:]_.\/-]+', '', 'g')`;

  const normalizedNoBrandRelaxedStep1 = sql`regexp_replace(${normalizedNoBrand}, '([0-9])mm', '\\1', 'gi')`;
  const normalizedNoBrandRelaxed = sql`regexp_replace(${normalizedNoBrandRelaxedStep1}, 'f([0-9])', '\\1', 'gi')`;
  const normalizedColRelaxedStep1 = sql`regexp_replace(${normalizedCol}, '([0-9])mm', '\\1', 'gi')`;
  const normalizedColRelaxed = sql`regexp_replace(${normalizedColRelaxedStep1}, 'f([0-9])', '\\1', 'gi')`;

  // Query-side brand and Nikon synonym stripping for ranking, mirroring WHERE
  const queryNormSql = sql`${normalizedQueryNoPunct}`;
  const queryNoBrand = sql`regexp_replace(${queryNormSql}, ${brandLower}, '', 'gi')`;
  const queryNoBrandWithSynonyms = sql`CASE WHEN ${brandLower} = 'nikon' THEN regexp_replace(${queryNoBrand}, 'nikkor', '', 'gi') ELSE ${queryNoBrand} END`;

  return sql<number>`GREATEST(
    CASE WHEN ${searchLower} ILIKE ${`%${query.toLowerCase().trim()}%`} THEN 2.0 ELSE 0 END,
    CASE WHEN ${normalizedCol} ILIKE ${`%${normalizedQueryNoPunct}%`} THEN 1.8 ELSE 0 END,
    CASE WHEN ${normalizedNoBrand} ILIKE ('%' || ${queryNoBrandWithSynonyms} || '%') THEN 1.0 ELSE 0 END,
    CASE WHEN ${normalizedNoBrandRelaxed} ILIKE ('%' || ${queryNoBrandWithSynonyms} || '%') THEN 1.0 ELSE 0 END,
    CASE WHEN ${normalizedColRelaxed} ILIKE ${`%${normalizedQueryNoPunct}%`} THEN 1.0 ELSE 0 END,
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
  includeMounts?: boolean;
  includeSensorFormats?: boolean;
  includeLensSpecs?: boolean;
  includeAnalogSpecs?: boolean;
}) {
  // Return only core gear fields; callers shouldn't rely on single mount anymore.
  let query = db
    .select({
      id: gear.id,
      name: gear.name,
      slug: gear.slug,
      brandName: brands.name,
      gearType: gear.gearType,
      thumbnailUrl: gear.thumbnailUrl,
      msrpNowUsdCents: gear.msrpNowUsdCents,
      msrpAtLaunchUsdCents: gear.msrpAtLaunchUsdCents,
      mpbMaxPriceUsdCents: gear.mpbMaxPriceUsdCents,
      releaseDate: gear.releaseDate,
      releaseDatePrecision: gear.releaseDatePrecision,
      announcedDate: gear.announcedDate,
      announceDatePrecision: gear.announceDatePrecision,
      ...(options.relevanceExpr && { relevance: options.relevanceExpr }),
    })
    .from(gear)
    .leftJoin(brands, sql`${gear.brandId} = ${brands.id}`);

  if (options.includeMounts) {
    query = query
      .leftJoin(gearMounts, eq(gear.id, gearMounts.gearId))
      .leftJoin(mounts, eq(gearMounts.mountId, mounts.id));
  }
  if (options.includeSensorFormats) {
    query = query
      .leftJoin(cameraSpecs, eq(gear.id, cameraSpecs.gearId))
      .leftJoin(sensorFormats, eq(cameraSpecs.sensorFormatId, sensorFormats.id));
  }
  if (options.includeLensSpecs) {
    query = query
      .leftJoin(lensSpecs, eq(gear.id, lensSpecs.gearId))
      .leftJoin(fixedLensSpecs, eq(gear.id, fixedLensSpecs.gearId));
  }
  if (options.includeAnalogSpecs) {
    query = query.leftJoin(analogCameraSpecs, eq(gear.id, analogCameraSpecs.gearId));
  }

  return query
    .where(options.whereClause)
    .orderBy(...options.orderBy)
    .limit(options.pageSize)
    .offset(options.offset);
}

/**
 * Execute the COUNT(*) for the current search constraints.
 */
export async function querySearchTotal(
  whereClause?: SQL,
  includeMounts?: boolean,
  includeSensorFormats?: boolean,
  includeLensSpecs?: boolean,
  includeAnalogSpecs?: boolean,
) {
  let query = db
    .select({ count: sql<number>`count(*)` })
    .from(gear)
    .leftJoin(brands, sql`${gear.brandId} = ${brands.id}`);

  if (includeMounts) {
    query = query
      .leftJoin(gearMounts, eq(gear.id, gearMounts.gearId))
      .leftJoin(mounts, eq(gearMounts.mountId, mounts.id));
  }
  if (includeSensorFormats) {
    query = query
      .leftJoin(cameraSpecs, eq(gear.id, cameraSpecs.gearId))
      .leftJoin(sensorFormats, eq(cameraSpecs.sensorFormatId, sensorFormats.id));
  }
  if (includeLensSpecs) {
    query = query
      .leftJoin(lensSpecs, eq(gear.id, lensSpecs.gearId))
      .leftJoin(fixedLensSpecs, eq(gear.id, fixedLensSpecs.gearId));
  }
  if (includeAnalogSpecs) {
    query = query.leftJoin(analogCameraSpecs, eq(gear.id, analogCameraSpecs.gearId));
  }

  const rows = await query.where(whereClause);
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
