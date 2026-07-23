import type { GearAlias } from "~/types/gear";

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
  mountNames?: string[];
  sensorFormatName?: string | null;
  analogCaptureMedium?: string | null;
  weightGrams?: number | null;
  focalLengthMinMm?: number | null;
  focalLengthMaxMm?: number | null;
  isPrime?: boolean | null;
  maxApertureWide?: number | null;
  maxApertureTele?: number | null;
};

export type SearchResponse = {
  results: SearchResult[];
  total?: number;
  totalPages?: number;
  page: number;
  pageSize: number;
};
