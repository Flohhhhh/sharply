import { describe,expect,it } from "vitest";
import { BADGE_CATALOG } from "~/lib/badges/catalog";
import { getBadgeDescriptionMessage } from "~/lib/badges/description";
import type { BadgeDefinition } from "~/types/badges";

function makeBadge(overrides: Partial<BadgeDefinition>): BadgeDefinition {
  return {
    key: "test",
    family: "misc",
    label: "Test",
    sortScore: 1,
    triggers: ["review.approved"],
    test: () => true,
    ...overrides,
  };
}

describe("getBadgeDescriptionMessage", () => {
  it("maps review ladder badges to translation keys", () => {
    expect(
      getBadgeDescriptionMessage(
        makeBadge({ family: "reviews", key: "reviews_1", level: 1 }),
      ),
    ).toEqual({ key: "badgeDescriptions.reviewsFirst" });

    expect(
      getBadgeDescriptionMessage(
        makeBadge({ family: "reviews", key: "reviews_20", level: 20 }),
      ),
    ).toEqual({
      key: "badgeDescriptions.reviewsCount",
      values: { count: 20 },
    });
  });

  it("handles anniversary special cases and yearly fallbacks", () => {
    expect(
      getBadgeDescriptionMessage(
        makeBadge({ family: "anniversary", key: "anniversary_182", level: 182 }),
      ),
    ).toEqual({ key: "badgeDescriptions.anniversarySixMonths" });

    expect(
      getBadgeDescriptionMessage(
        makeBadge({ family: "anniversary", key: "anniversary_1095", level: 1095 }),
      ),
    ).toEqual({
      key: "badgeDescriptions.anniversaryYears",
      values: { count: 3 },
    });
  });

  it("returns null without badge metadata", () => {
    expect(getBadgeDescriptionMessage()).toBeNull();
  });

  it("keeps wishlist catalog descriptions clear for singular and plural levels", () => {
    expect(BADGE_CATALOG.find((badge) => badge.key === "wishlist_1")?.description)
      .toBe("Add the first item to your wishlist");

    expect(BADGE_CATALOG.find((badge) => badge.key === "wishlist_5")?.description)
      .toBe("Have at least 5 items on your wishlist");
  });
});
