export type BrowseFeedItem = {
  id: string;
  slug: string;
  name: string;
  brandName: string | null;
  thumbnailUrl: string | null;
  gearType: string | null;
  releaseDate: string | null;
  msrpNowUsdCents: number | null;
  mpbMaxPriceUsdCents: number | null;
};

export type BrowseFeedPage = {
  items: BrowseFeedItem[];
  nextCursor: {
    beforeRelease: string;
    beforeId: string;
  } | null;
  hasMore: boolean;
};
