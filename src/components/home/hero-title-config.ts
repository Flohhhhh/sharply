export const HERO_TITLE_ROTATING_WORD_KEYS = ["simple", "fast", "easy"] as const;

export type HeroTitleRotatingWordKey =
  (typeof HERO_TITLE_ROTATING_WORD_KEYS)[number];
