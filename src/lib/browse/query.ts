import {
  parseFilters,
  type BrowseFilters,
  type SortOption,
} from "./filters";
import type { RouteScope } from "./routing";
import { LENS_FOCAL_LENGTH_SORT } from "./sort-constants";

export type BrowseSearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

export function getBrowseDefaultSort(scope: RouteScope): SortOption {
  if (scope.categorySlug === "lenses" && scope.mountShort) {
    return LENS_FOCAL_LENGTH_SORT;
  }
  return "newest";
}

export function normalizeBrowseFilters(
  searchParams: BrowseSearchParamsRecord,
  scope: RouteScope,
): BrowseFilters {
  const base = parseFilters(searchParams, {
    defaultSort: getBrowseDefaultSort(scope),
  });

  if (scope.categorySlug === "lenses" && scope.mountShort) {
    return { ...base, page: 1, perPage: 500 };
  }

  return base;
}

export function urlSearchParamsToRecord(
  searchParams: URLSearchParams,
): BrowseSearchParamsRecord {
  const record: BrowseSearchParamsRecord = {};

  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    if (!values.length) continue;
    record[key] = values.length === 1 ? values[0] : values;
  }

  return record;
}

export function buildBrowseListApiSearchParams(params: {
  scope: RouteScope;
  filters: BrowseFilters;
}) {
  const searchParams = new URLSearchParams();
  const { scope, filters } = params;

  searchParams.set("view", "list");
  searchParams.set("sort", filters.sort);
  searchParams.set("page", String(filters.page));
  searchParams.set("perPage", String(filters.perPage));

  if (scope.brandSlug) searchParams.set("brandSlug", scope.brandSlug);
  if (scope.categorySlug) searchParams.set("category", scope.categorySlug);
  if (scope.mountShort) searchParams.set("mount", scope.mountShort);

  appendNumber(searchParams, "minPrice", filters.minPrice);
  appendNumber(searchParams, "maxPrice", filters.maxPrice);
  appendNumber(searchParams, "minRating", filters.minRating);
  appendNumber(searchParams, "minYear", filters.minYear);
  appendNumber(searchParams, "maxYear", filters.maxYear);
  appendNumber(searchParams, "minFocal", filters.minFocal);
  appendNumber(searchParams, "maxFocal", filters.maxFocal);
  appendNumber(searchParams, "minAperture", filters.minAperture);
  appendNumber(searchParams, "maxAperture", filters.maxAperture);
  appendNumber(searchParams, "minMp", filters.minMp);
  appendNumber(searchParams, "maxMp", filters.maxMp);
  appendNumber(searchParams, "minIso", filters.minIso);
  appendNumber(searchParams, "maxIso", filters.maxIso);

  appendList(searchParams, "sensor", filters.sensor);
  appendList(searchParams, "useCase", filters.useCase);

  if (filters.brandOverride) {
    searchParams.set("brand", filters.brandOverride);
  }

  return searchParams;
}

export function buildBrowseListApiPath(params: {
  scope: RouteScope;
  filters: BrowseFilters;
}) {
  const searchParams = buildBrowseListApiSearchParams(params);
  const query = searchParams.toString();
  return `/api/gear/browse${query ? `?${query}` : ""}`;
}

function appendNumber(
  searchParams: URLSearchParams,
  key: string,
  value?: number,
) {
  if (value == null) return;
  searchParams.set(key, String(value));
}

function appendList(
  searchParams: URLSearchParams,
  key: string,
  value?: string[],
) {
  if (!value?.length) return;
  for (const item of value) {
    searchParams.append(key, item);
  }
}
