import type { GearType } from "~/types/gear";

export type TrendingFiltersInput = {
  brandId?: string;
  mountId?: string;
  gearType?: GearType;
};

export type TrendingEntry = {
  gearId: string;
  slug: string;
  name: string;
  brandName: string;
  gearType: GearType;
  thumbnailUrl: string | null;
  msrpNowUsdCents: number | null;
  mpbMaxPriceUsdCents: number | null;
  lifetimeViews: number;
  score: number;
  liveBoost?: number;
  liveStats?: {
    views: number;
    wishlistAdds: number;
    ownerAdds: number;
    compareAdds: number;
    reviewSubmits: number;
  };
  liveOnly?: boolean;
  stats: {
    views: number;
    wishlistAdds: number;
    ownerAdds: number;
    compareAdds: number;
    reviewSubmits: number;
  };
  asOfDate: string;
};

export type LiveTrendingSnapshotItem = {
  gearId: string;
  slug: string;
  name: string;
  brandName: string;
  gearType: GearType;
  thumbnailUrl: string | null;
  msrpNowUsdCents: number | null;
  mpbMaxPriceUsdCents: number | null;
  lifetimeViews: number;
  liveScore: number;
  stats: TrendingEntry["stats"];
  asOfDate: string;
};

export type LiveTrendingSnapshot = {
  generatedAt: string;
  items: LiveTrendingSnapshotItem[];
};

export type TrendingPageResult = {
  items: TrendingEntry[];
  total: number;
  page: number;
  perPage: number;
  timeframe: "7d" | "30d";
  filters: TrendingFiltersInput;
};
