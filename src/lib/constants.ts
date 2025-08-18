// Popularity tracking constants
export const POPULARITY_POINTS = {
  VISIT: 1,
  WISHLIST: 10,
  OWNERSHIP: 20,
  COMPARE: 5,
  REVIEW: 10,
  SHARE: 10,
} as const;

export type PopularityEventType = keyof typeof POPULARITY_POINTS;

// Re-export generated constants
export * from "./generated";

// Complaint/highlight/usage constants removed (simplified composer)
