export type ProfileUserListState = {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  itemCount: number;
  items: Array<{
    id: string;
    position: number;
    gear: {
      id: string;
      slug: string;
      name: string;
      regionalAliases: Array<{
        gearId: string;
        region: "GLOBAL" | "EU" | "JP";
        name: string;
        createdAt: string | Date;
        updatedAt: string | Date;
      }> | null;
      brandName: string | null;
      gearType: string;
      thumbnailUrl: string | null;
      releaseDate: string | Date | null;
      releaseDatePrecision: "DAY" | "MONTH" | "YEAR" | null;
      announcedDate: string | Date | null;
      announceDatePrecision: "DAY" | "MONTH" | "YEAR" | null;
      msrpNowUsdCents: number | null;
      mpbMaxPriceUsdCents: number | null;
    };
  }>;
  shared: {
    id: string;
    slug: string;
    publicId: string;
    isPublished: boolean;
    publishedAt: string | Date | null;
    unpublishedAt: string | Date | null;
    path: string;
  } | null;
};
