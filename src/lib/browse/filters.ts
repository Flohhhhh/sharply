export type SortOption =
  | "relevance"
  | "newest"
  | "rating"
  | "price_asc"
  | "price_desc"
  | "popularity";

export type BrowseFilters = {
  sort: SortOption;
  page: number;
  perPage: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minYear?: number;
  maxYear?: number;
  sensor?: string[];
  minFocal?: number;
  maxFocal?: number;
  minAperture?: number;
  maxAperture?: number;
  minMp?: number;
  maxMp?: number;
  minIso?: number;
  maxIso?: number;
  useCase?: string[];
  brandOverride?: string;
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(n, hi));

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): BrowseFilters {
  const get = (k: string) => searchParams[k];
  const num = (k: string) => {
    const v = get(k);
    if (v == null) return undefined;
    const s = Array.isArray(v) ? v[0] : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };
  const list = (k: string) => {
    const v = get(k);
    if (v == null) return undefined;
    const s = Array.isArray(v) ? v.join(",") : v;
    const parts = s
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length ? parts : undefined;
  };

  const sort = (() => {
    const v = get("sort");
    const s = Array.isArray(v) ? v[0] : v;
    const allowed: SortOption[] = [
      "relevance",
      "newest",
      "rating",
      "price_asc",
      "price_desc",
      "popularity",
    ];
    return allowed.includes((s as SortOption) ?? "relevance")
      ? ((s as SortOption) ?? "relevance")
      : "relevance";
  })();

  const pageRaw = num("page") ?? 1;
  const perPageRaw = num("perPage") ?? 24;

  const filters: BrowseFilters = {
    sort,
    page: Math.max(1, Math.floor(pageRaw)),
    perPage: clamp(Math.max(1, Math.floor(perPageRaw)), 1, 96),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minRating: num("minRating"),
    minYear: num("minYear"),
    maxYear: num("maxYear"),
    sensor: list("sensor"),
    minFocal: num("minFocal"),
    maxFocal: num("maxFocal"),
    minAperture: num("minAperture"),
    maxAperture: num("maxAperture"),
    minMp: num("minMp"),
    maxMp: num("maxMp"),
    minIso: num("minIso"),
    maxIso: num("maxIso"),
    useCase: list("useCase"),
  };

  const brandOverride = get("brand");
  if (brandOverride)
    filters.brandOverride = Array.isArray(brandOverride)
      ? brandOverride[0]
      : brandOverride;

  const normalizePair = (a?: number, b?: number) =>
    a != null && b != null && a > b ? [b, a] : [a, b];
  [filters.minPrice, filters.maxPrice] = normalizePair(
    filters.minPrice,
    filters.maxPrice,
  );
  [filters.minYear, filters.maxYear] = normalizePair(
    filters.minYear,
    filters.maxYear,
  );
  [filters.minFocal, filters.maxFocal] = normalizePair(
    filters.minFocal,
    filters.maxFocal,
  );
  [filters.minAperture, filters.maxAperture] = normalizePair(
    filters.minAperture,
    filters.maxAperture,
  );
  [filters.minMp, filters.maxMp] = normalizePair(filters.minMp, filters.maxMp);
  [filters.minIso, filters.maxIso] = normalizePair(
    filters.minIso,
    filters.maxIso,
  );

  return filters;
}
