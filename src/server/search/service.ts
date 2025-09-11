import "server-only";

import { gear, brands, mounts } from "~/server/db/schema";
import { asc, desc, sql, and, type SQL } from "drizzle-orm";
import {
  buildSearchWhereClause,
  buildRelevanceExpr,
  querySearchRows,
  querySearchTotal,
  queryGearSuggestions,
  queryBrandSuggestions,
} from "./data";

/**
 * Search Service Layer
 *
 * Responsibilities:
 * - Orchestrates inputs (query, filters, pagination) and composes data-layer functions.
 * - Shapes return types for API/server components.
 * - Leaves low-level SQL/DB details to data.ts.
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
  const { query, sort, page, pageSize, filters } = params;
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
        sql`${gear.msrpNowUsdCents} >= ${filters.priceMin * 100}`,
      );
    }
    if (filters.priceMax !== undefined) {
      filterConditions.push(
        sql`${gear.msrpNowUsdCents} <= ${filters.priceMax * 100}`,
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
    orderBy = [desc(gear.releaseDate), asc(gear.name)];
  } else {
    orderBy = [asc(gear.name)];
  }

  const rows = await querySearchRows({
    whereClause,
    orderBy,
    pageSize,
    offset,
    relevanceExpr: query && sort === "relevance" ? relevanceExpr : undefined,
  });

  const total = await querySearchTotal(whereClause);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    results: rows as unknown as SearchResult[],
    total,
    totalPages,
    page,
    pageSize,
  };
}

export async function getSuggestions(
  query: string,
  limit = 8,
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
  const brandResults = await queryBrandSuggestions(normalizedQuery);

  const suggestions: Suggestion[] = [
    ...gearResults.map((item) => ({
      id: `gear:${item.id}`,
      label: `${item.name}${item.brandName ? ` (${item.brandName})` : ""}`,
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
