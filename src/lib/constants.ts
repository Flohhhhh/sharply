// Popularity tracking constants
export const POPULARITY_POINTS = {
  WISHLIST: 1,
  OWNERSHIP: 1,
  COMPARE: 1,
  REVIEW: 2,
  SHARE: 1,
} as const;

export type PopularityEventType = keyof typeof POPULARITY_POINTS;
