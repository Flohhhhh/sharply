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

// --- Review System Constants ---
export type ReviewOption = { id: string; name: string };

export const REVIEW_GENRES: ReviewOption[] = [
  { id: "portraits", name: "Portraits" },
  { id: "weddings", name: "Weddings" },
  { id: "sports", name: "Sports" },
  { id: "wildlife", name: "Wildlife" },
  { id: "street", name: "Street" },
  { id: "travel", name: "Travel" },
  { id: "landscape", name: "Landscape" },
  { id: "macro", name: "Macro" },
  { id: "product", name: "Product" },
  { id: "events", name: "Events" },
  { id: "video", name: "Video" },
];

// Complaint/highlight/usage constants removed (simplified composer)
