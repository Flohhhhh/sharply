import type { GearAlias } from "~/types/gear";

export type BrowseFeedItem = {
  id: string;
  slug: string;
  name: string;
  regionalAliases?: GearAlias[] | null;
  brandName: string | null;
  thumbnailUrl: string | null;
  gearType: string | null;
  releaseDate: string | null;
  releaseDatePrecision: "DAY" | "MONTH" | "YEAR" | null;
  announcedDate: string | null;
  announceDatePrecision: "DAY" | "MONTH" | "YEAR" | null;
  msrpNowUsdCents: number | null;
  mpbMaxPriceUsdCents: number | null;
};

export type BrowseFeedPage = {
  items: BrowseFeedItem[];
  nextCursor: {
    offset: number;
  } | null;
  hasMore: boolean;
};
