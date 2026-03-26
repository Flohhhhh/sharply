// In Next.js runtime, enforce server-only import. In scripts (Node), skip.
if (process.env.NEXT_RUNTIME) {
  import("server-only").catch(() => {
    console.warn("[search:service] server-only import failed, skipping.");
  });
}

import {
  gear,
  brands,
  mounts,
  cameraSpecs,
  sensorFormats,
  lensSpecs,
  fixedLensSpecs,
  analogCameraSpecs,
} from "~/server/db/schema";
import { asc, desc, sql, type SQL } from "drizzle-orm";
import {
  buildSearchWhereClause,
  buildRelevanceExpr,
  querySearchRows,
  querySearchTotal,
  queryGearSuggestions,
  queryBrandSuggestions,
} from "./data";
import { fetchGearAliasesByGearIds } from "~/server/gear/data";
import type { GearAlias, GearRegion } from "~/types/gear";
import { buildCompareHref } from "~/lib/utils/url";
import type {
  BrandSuggestion,
  CompareSmartActionSuggestion,
  GearSuggestion,
  Suggestion,
} from "~/types/search";
import {
  applyExactMatchMetadata,
  buildGearSuggestion,
  parseCompareIntent,
} from "./suggestion-intent";

/**
 * Search Service Layer
 *
 * Responsibilities:
 * - Orchestrates inputs (query, filters, pagination) and composes data-layer functions.
 * - Shapes return types for API/server components.
 * - Leaves low-level SQL/DB details to data.ts.
 */
export type SearchSort =
  | "relevance"
  | "name"
  | "newest"
  | "price_asc"
  | "price_desc";

export type SearchFilters = {
  brand?: string;
  mount?: string;
  gearType?: string;
  priceMin?: number;
  priceMax?: number;
  sensorFormat?: string;
  lensType?: "prime" | "zoom";
  megapixelsMin?: number;
  megapixelsMax?: number;
  analogCameraType?: string;
};

export type SearchParams = {
  query?: string;
  sort: SearchSort;
  page: number;
  pageSize: number;
  filters?: SearchFilters;
  includeTotal?: boolean;
};

export type SearchResult = {
  id: string;
  name: string;
  slug: string;
  regionalAliases?: GearAlias[] | null;
  brandName: string | null;
  mountValue: string | null;
  gearType: string;
  thumbnailUrl: string | null;
  msrpNowUsdCents?: number | null;
  msrpAtLaunchUsdCents?: number | null;
  mpbMaxPriceUsdCents?: number | null;
  releaseDate?: Date | string | null;
  releaseDatePrecision?: string | null;
  announcedDate?: Date | string | null;
  announceDatePrecision?: string | null;
  relevance?: number;
};

export type SearchResponse = {
  results: SearchResult[];
  total?: number;
  totalPages?: number;
  page: number;
  pageSize: number;
};

// use buildSearchWhereClause directly from data.ts

export async function searchGear(
  params: SearchParams,
): Promise<SearchResponse> {
  const { query, sort, page, pageSize, filters, includeTotal } = params;
  const offset = (page - 1) * pageSize;

  let whereClause: SQL | undefined = undefined;
  let normalizedQueryNoPunct: string | null = null;
  if (query && query.trim().length > 0) {
    whereClause = buildSearchWhereClause(query);
    normalizedQueryNoPunct = query
      .toLowerCase()
      .trim()
      .replace(/[\s\-_.]+/g, "");
  }

  if (filters) {
    const filterConditions: SQL[] = [];
    const hasPrice = sql`
      ${gear.msrpNowUsdCents} IS NOT NULL
      OR ${gear.msrpAtLaunchUsdCents} IS NOT NULL
      OR ${gear.mpbMaxPriceUsdCents} IS NOT NULL
    `;
    // Prefer current MSRP, then used market (MPB), then launch MSRP.
    const effectivePriceCentsForMax = sql`COALESCE(${gear.msrpNowUsdCents}, ${gear.mpbMaxPriceUsdCents}, ${gear.msrpAtLaunchUsdCents})`;
    // For min bounds, prefer current MSRP, then launch, then used price.
    const effectivePriceCentsForMin = sql`COALESCE(${gear.msrpNowUsdCents}, ${gear.msrpAtLaunchUsdCents}, ${gear.mpbMaxPriceUsdCents})`;
    if (filters.brand) {
      filterConditions.push(sql`${brands.name} ILIKE ${`%${filters.brand}%`}`);
    }
    if (filters.mount) {
      filterConditions.push(sql`${mounts.id} = ${filters.mount}`);
    }
    if (filters.gearType) {
      filterConditions.push(sql`${gear.gearType} = ${filters.gearType}`);
    }
    if (filters.sensorFormat) {
      filterConditions.push(
        sql`${sensorFormats.slug} = ${filters.sensorFormat}`,
      );
    }
    if (filters.lensType) {
      const isPrime = filters.lensType === "prime";
      filterConditions.push(
        sql`(${lensSpecs.isPrime} = ${isPrime} OR ${fixedLensSpecs.isPrime} = ${isPrime})`,
      );
    }
    if (filters.analogCameraType) {
      filterConditions.push(
        sql`${analogCameraSpecs.cameraType} = ${filters.analogCameraType}`,
      );
    }
    const adjustedMpMin =
      filters.megapixelsMin !== undefined
        ? Math.max(0, filters.megapixelsMin - 0.9)
        : undefined;
    const adjustedMpMax =
      filters.megapixelsMax !== undefined
        ? filters.megapixelsMax + 0.9
        : undefined;
    if (filters.megapixelsMin !== undefined) {
      filterConditions.push(
        sql`${cameraSpecs.resolutionMp} >= ${adjustedMpMin!}`,
      );
    }
    if (filters.megapixelsMax !== undefined) {
      filterConditions.push(
        sql`${cameraSpecs.resolutionMp} <= ${adjustedMpMax!}`,
      );
    }
    if (filters.priceMin !== undefined) {
      // Require a known price and enforce the lower bound.
      filterConditions.push(
        sql`(${hasPrice}) AND (${effectivePriceCentsForMin} >= ${filters.priceMin * 100})`,
      );
    }
    if (filters.priceMax !== undefined) {
      filterConditions.push(
        sql`(NOT (${hasPrice}) OR ${effectivePriceCentsForMax} <= ${filters.priceMax * 100})`,
      );
    }

    if (filterConditions.length > 0) {
      const filterClause = sql`(${sql.join(filterConditions, sql` AND `)})`;
      whereClause = whereClause
        ? sql`(${whereClause}) AND (${filterClause})`
        : filterClause;
    }
  }

  const relevanceExpr = query
    ? buildRelevanceExpr(query, normalizedQueryNoPunct!)
    : sql<number>`0`;

  let orderBy: any[];
  if (query && sort === "relevance") {
    orderBy = [desc(relevanceExpr), asc(gear.name)];
  } else if (sort === "newest") {
    orderBy = [sql`${gear.releaseDate} DESC NULLS LAST`, asc(gear.name)];
  } else if (sort === "price_asc") {
    orderBy = [asc(gear.msrpNowUsdCents), asc(gear.name)];
  } else if (sort === "price_desc") {
    orderBy = [sql`${gear.msrpNowUsdCents} DESC NULLS LAST`, asc(gear.name)];
  } else {
    orderBy = [asc(gear.name)];
  }

  const rows = (await querySearchRows({
    whereClause,
    orderBy,
    pageSize,
    offset,
    relevanceExpr: query && sort === "relevance" ? relevanceExpr : undefined,
    includeMounts: Boolean(filters?.mount),
    includeSensorFormats:
      Boolean(filters?.sensorFormat) ||
      filters?.megapixelsMin !== undefined ||
      filters?.megapixelsMax !== undefined,
    includeLensSpecs: Boolean(filters?.lensType),
    includeAnalogSpecs: Boolean(filters?.analogCameraType),
  })) as unknown as Array<{ id: string }>;

  const aliasesById = await fetchGearAliasesByGearIds(
    rows.map((row) => row.id),
  );

  const results = rows.map((row) => ({
    ...row,
    regionalAliases: aliasesById.get(row.id) ?? [],
  }));

  const total =
    includeTotal === false
      ? undefined
      : await querySearchTotal(
          whereClause,
          Boolean(filters?.mount),
          Boolean(filters?.sensorFormat) ||
            filters?.megapixelsMin !== undefined ||
            filters?.megapixelsMax !== undefined,
          Boolean(filters?.lensType),
          Boolean(filters?.analogCameraType),
        );
  const totalPages =
    total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : undefined;

  return {
    results: results as unknown as SearchResult[],
    total,
    totalPages,
    page,
    pageSize,
  };
}

export async function getSuggestions(
  query: string,
  limit = 8,
  region?: GearRegion | null,
): Promise<Suggestion[]> {
  if (!query || query.length < 2) return [];

  const compareIntent = parseCompareIntent(query);
  const smartAction = compareIntent
    ? await buildCompareSmartAction(compareIntent.left, compareIntent.right, region)
    : null;

  const rankedSuggestions = await buildRankedSuggestions(query, region);

  return (smartAction
    ? [smartAction, ...rankedSuggestions]
    : rankedSuggestions
  ).slice(0, limit);
}

type SuggestGearRow = {
  id: string;
  name: string;
  slug: string;
  brandName: string | null;
  gearType: string;
  relevance?: number;
};

async function buildRankedSuggestions(
  query: string,
  region?: GearRegion | null,
): Promise<Suggestion[]> {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedQueryNoPunct = normalizedQuery.replace(/[\s\-_.]+/g, "");
  const whereClause = buildSearchWhereClause(query)!;
  const relevanceExpr = buildRelevanceExpr(query, normalizedQueryNoPunct);

  const gearResults = await queryGearSuggestions(whereClause, relevanceExpr);
  const gearSuggestions = await buildGearSuggestions(gearResults, query, region);
  const brandResults = await queryBrandSuggestions(normalizedQuery);
  const brandSuggestions: BrandSuggestion[] = brandResults.map((item) => ({
    id: `brand:${item.id}`,
    kind: "brand",
    type: "brand",
    brandId: item.id,
    brandName: item.name,
    title: item.name,
    label: item.name,
    subtitle: "Brand",
    href: `/brand/${item.slug}`,
    relevance: item.relevance,
  }));

  return [...gearSuggestions, ...brandSuggestions].sort(
    (a, b) => (b.relevance ?? 0) - (a.relevance ?? 0),
  );
}

async function buildGearSuggestions(
  gearResults: SuggestGearRow[],
  query: string,
  region?: GearRegion | null,
): Promise<GearSuggestion[]> {
  const aliasesById = await fetchGearAliasesByGearIds(
    gearResults.map((item) => item.id),
  );

  const suggestionInputs = new Map<
    string,
    SuggestGearRow & { regionalAliases: GearAlias[] }
  >();

  const baseSuggestions = gearResults.map((item) => {
    const regionalAliases = aliasesById.get(item.id) ?? [];
    suggestionInputs.set(item.id, { ...item, regionalAliases });
    return buildGearSuggestion({ ...item, regionalAliases }, region);
  });

  return applyExactMatchMetadata(query, baseSuggestions, suggestionInputs, region);
}

async function buildCompareSmartAction(
  leftQuery: string,
  rightQuery: string,
  region?: GearRegion | null,
): Promise<CompareSmartActionSuggestion | null> {
  const [left, right] = await Promise.all([
    resolveStrongGearMatch(leftQuery, region),
    resolveStrongGearMatch(rightQuery, region),
  ]);

  if (!left || !right) return null;
  if (left.gearId === right.gearId) return null;

  return {
    id: `smart-action:compare:${left.gearId}:${right.gearId}`,
    kind: "smart-action",
    type: "smart-action",
    action: "compare",
    title: `Compare ${left.title} and ${right.title}`,
    label: `Compare ${left.title} and ${right.title}`,
    subtitle: `${left.canonicalName} vs ${right.canonicalName}`,
    href: buildCompareHref([left.href.replace("/gear/", ""), right.href.replace("/gear/", "")], {
      preserveOrder: true,
    }),
    compareSlugs: [
      left.href.replace("/gear/", ""),
      right.href.replace("/gear/", ""),
    ],
    compareTitles: [left.title, right.title],
    relevance: Math.max(left.relevance ?? 0, right.relevance ?? 0),
  };
}

async function resolveStrongGearMatch(
  query: string,
  region?: GearRegion | null,
): Promise<GearSuggestion | null> {
  const ranked = await buildRankedSuggestions(query, region);
  const exactGearMatches = ranked.filter(
    (suggestion): suggestion is GearSuggestion =>
      (suggestion.kind === "camera" || suggestion.kind === "lens") &&
      suggestion.isBestMatch,
  );

  if (exactGearMatches.length !== 1) return null;

  return exactGearMatches[0] ?? null;
}
