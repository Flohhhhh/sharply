import { describe, expect, it } from "vitest";

import {
  buildGearSectionNavItems,
  hasStaffVerdictContent,
} from "~/app/[locale]/(pages)/gear/_components/gear-section-nav";

describe("hasStaffVerdictContent", () => {
  it("returns false for empty verdict arrays and whitespace-only text", () => {
    expect(
      hasStaffVerdictContent({
        content: "   ",
        pros: [],
        cons: [""],
        whoFor: "  ",
        notFor: null,
        alternatives: [" "],
      }),
    ).toBe(false);
  });

  it("returns true when any verdict field has displayable content", () => {
    expect(
      hasStaffVerdictContent({
        content: null,
        pros: ["Compact body"],
      }),
    ).toBe(true);
  });
});

describe("buildGearSectionNavItems", () => {
  it("includes only sections that exist on the page", () => {
    expect(
      buildGearSectionNavItems({
        hasEditorialReview: false,
        hasCreatorVideos: false,
        hasRawSamples: false,
        hasAlternatives: true,
        hasRelatedArticles: true,
        verdict: null,
      }),
    ).toEqual([
      { href: "#specs", label: "Specs" },
      { href: "#reviews", label: "Reviews" },
      { href: "#alternatives", label: "Alternatives" },
      { href: "#related-articles", label: "Articles" },
    ]);
  });

  it("adds optional review, raw sample, and staff verdict links when present", () => {
    expect(
      buildGearSectionNavItems({
        hasEditorialReview: true,
        hasCreatorVideos: false,
        hasRawSamples: true,
        hasAlternatives: false,
        hasRelatedArticles: false,
        verdict: {
          whoFor: "Travel photographers",
        },
      }),
    ).toEqual([
      { href: "#staff-verdict", label: "Staff Verdict" },
      { href: "#specs", label: "Specs" },
      { href: "#editorial-review", label: "Review" },
      { href: "#reviews", label: "Reviews" },
      { href: "#raw-samples", label: "Raw Samples" },
    ]);
  });

  it("includes the creator videos section when present", () => {
    expect(
      buildGearSectionNavItems({
        hasEditorialReview: false,
        hasCreatorVideos: true,
        hasRawSamples: false,
        hasAlternatives: false,
        hasRelatedArticles: true,
        verdict: null,
      }),
    ).toEqual([
      { href: "#specs", label: "Specs" },
      { href: "#reviews", label: "Reviews" },
      { href: "#creator-videos", label: "Creator Videos" },
      { href: "#related-articles", label: "Articles" },
    ]);
  });
});
