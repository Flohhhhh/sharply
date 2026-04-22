import type { BadgeDefinition } from "~/types/badges";

type BadgeTranslationValues = Record<string, string | number>;

export type BadgeDescriptionMessage =
  | {
      key: string;
      values?: BadgeTranslationValues;
    }
  | null;

export function getBadgeDescriptionMessage(
  badge?: BadgeDefinition | null,
): BadgeDescriptionMessage {
  if (!badge) return null;

  if (badge.key === "pioneer") {
    return { key: "badgeDescriptions.pioneer" };
  }

  if (badge.family === "reviews") {
    return badge.level === 1
      ? { key: "badgeDescriptions.reviewsFirst" }
      : {
          key: "badgeDescriptions.reviewsCount",
          values: { count: badge.level ?? 0 },
        };
  }

  if (badge.family === "ownership") {
    return badge.level === 1
      ? { key: "badgeDescriptions.ownershipFirst" }
      : {
          key: "badgeDescriptions.ownershipCount",
          values: { count: badge.level ?? 0 },
        };
  }

  if (badge.family === "edits") {
    return badge.level === 1
      ? { key: "badgeDescriptions.editsFirst" }
      : {
          key: "badgeDescriptions.editsCount",
          values: { count: badge.level ?? 0 },
        };
  }

  if (badge.family === "anniversary") {
    if (badge.level === 7) return { key: "badgeDescriptions.anniversaryWeek" };
    if (badge.level === 30) return { key: "badgeDescriptions.anniversaryMonth" };
    if (badge.level === 182) {
      return { key: "badgeDescriptions.anniversarySixMonths" };
    }
    if (badge.level === 365) return { key: "badgeDescriptions.anniversaryYear" };
    return {
      key: "badgeDescriptions.anniversaryYears",
      values: { count: Math.round((badge.level ?? 0) / 365) },
    };
  }

  if (badge.family === "wishlist") {
    if (badge.level === 1) return { key: "badgeDescriptions.wishlistFirst" };
    if (badge.level === 5) return { key: "badgeDescriptions.wishlistFive" };
    if (badge.level === 10) return { key: "badgeDescriptions.wishlistTen" };
    if (badge.level === 20) return { key: "badgeDescriptions.wishlistTwenty" };
    return { key: "badgeDescriptions.wishlistFifty" };
  }

  return null;
}
