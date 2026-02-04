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
import { asc, desc, sql, and, type SQL } from "drizzle-orm";
import {
  buildSearchWhereClause,
  buildRelevanceExpr,
  querySearchRows,
  querySearchTotal,
  queryGearSuggestions,
  queryBrandSuggestions,
} from "./data";
import { fetchGearAliasesByGearIds } from "~/server/gear/data";
import { GetGearDisplayName } from "~/lib/gear/naming";
import type { GearAlias, GearRegion } from "~/types/gear";

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

export type Suggestion = {
  id: string;
  label: string;
  href: string;
  type: "gear" | "brand";
  relevance?: number;
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

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedQueryNoPunct = normalizedQuery.replace(/[\s\-_.]+/g, "");

  const parts = normalizedQuery
    .split(/[\s_]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.trim());

  const whereClause = buildSearchWhereClause(query)!;
  const relevanceExpr = buildRelevanceExpr(query, normalizedQueryNoPunct);

  const gearResults = await queryGearSuggestions(whereClause, relevanceExpr);
  const aliasesById = await fetchGearAliasesByGearIds(
    gearResults.map((item) => item.id),
  );
  const brandResults = await queryBrandSuggestions(normalizedQuery);

  const suggestions: Suggestion[] = [
    ...gearResults.map((item) => ({
      id: `gear:${item.id}`,
      label: `${GetGearDisplayName(
        {
          name: item.name,
          regionalAliases: aliasesById.get(item.id) ?? [],
        },
        { region },
      )}${item.brandName ? ` (${item.brandName})` : ""}`,
      href: `/gear/${item.slug}`,
      type: "gear" as const,
      relevance: item.relevance,
    })),
    ...brandResults.map((item) => ({
      id: `brand:${item.id}`,
      label: `${item.name} (Brand)`,
      href: `/brand/${item.slug}`,
      type: "brand" as const,
      relevance: item.relevance,
    })),
  ]
    .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0))
    .slice(0, limit);

  return suggestions;
}
