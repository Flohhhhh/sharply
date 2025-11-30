export type GearType = "CAMERA" | "LENS";

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
  stats: {
    views: number;
    wishlistAdds: number;
    ownerAdds: number;
    compareAdds: number;
    reviewSubmits: number;
  };
  asOfDate: string;
};

export type TrendingPageResult = {
  items: TrendingEntry[];
  total: number;
  page: number;
  perPage: number;
  timeframe: "7d" | "30d";
  filters: TrendingFiltersInput;
};
