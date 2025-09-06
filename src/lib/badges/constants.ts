export const ALLOWED_TRIGGERS = [
  "review.approved",
  "edit.approved",
  "ownership.added",
  "ownership.removed",
  "wishlist.added",
  "compare.used",
  "cron.anniversary",
] as const;

export type AllowedTrigger = (typeof ALLOWED_TRIGGERS)[number];

export const BADGE_FAMILIES = {
  MISC: "misc",
} as const;
