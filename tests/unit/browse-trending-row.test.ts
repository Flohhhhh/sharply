import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));
vi.mock("~/server/gear/data", () => ({
  fetchGearAliasesByGearIds: vi.fn(),
}));
vi.mock("~/server/gear/browse/data", () => ({
  getBrandBySlug: vi.fn(),
  getMountByShortName: vi.fn(),
  getMountsForBrand: vi.fn(),
  getReleaseOrderedGearPage: vi.fn(),
  searchGear: vi.fn(),
}));
vi.mock("~/server/popularity/service", () => ({
  fetchTrending: vi.fn(),
}));

import {
  selectBrowseTrendingRowItems,
  type BrowseTrendingCardFields,
} from "~/server/gear/browse/service";

function makeItem(
  slug: string,
  overrides: Partial<BrowseTrendingCardFields> = {},
): BrowseTrendingCardFields {
  return {
    slug,
    name: slug,
    regionalAliases: [],
    brandName: "Nikon",
    thumbnailUrl: null,
    gearType: "CAMERA",
    releaseDate: null,
    releaseDatePrecision: null,
    announcedDate: null,
    announceDatePrecision: null,
    msrpNowUsdCents: null,
    mpbMaxPriceUsdCents: null,
    ...overrides,
  };
}

describe("selectBrowseTrendingRowItems", () => {
  it("returns the original 7d trending items when three exist", () => {
    const items = selectBrowseTrendingRowItems({
      trending7d: [makeItem("a"), makeItem("b"), makeItem("c")],
      trending30d: [makeItem("d"), makeItem("e"), makeItem("f")],
      newest: [makeItem("g"), makeItem("h"), makeItem("i")],
    });

    expect(items.map((item) => item.slug)).toEqual(["a", "b", "c"]);
    expect(items.map((item) => item.source)).toEqual(["7d", "7d", "7d"]);
    expect(items.every((item) => item.isTrending)).toBe(true);
  });

  it("fills missing slots from 30d trending before newest gear", () => {
    const items = selectBrowseTrendingRowItems({
      trending7d: [makeItem("a")],
      trending30d: [makeItem("a"), makeItem("b"), makeItem("c")],
      newest: [makeItem("d"), makeItem("e"), makeItem("f")],
    });

    expect(items.map((item) => item.slug)).toEqual(["a", "b", "c"]);
    expect(items.map((item) => item.source)).toEqual(["7d", "30d", "30d"]);
    expect(items.every((item) => item.isTrending)).toBe(true);
  });

  it("falls back to newest gear when combined trending is still short", () => {
    const items = selectBrowseTrendingRowItems({
      trending7d: [makeItem("a")],
      trending30d: [makeItem("a")],
      newest: [makeItem("a"), makeItem("b"), makeItem("c")],
    });

    expect(items.map((item) => item.slug)).toEqual(["a", "b", "c"]);
    expect(items.map((item) => item.source)).toEqual([
      "7d",
      "newest",
      "newest",
    ]);
    expect(items.map((item) => item.isTrending)).toEqual([true, false, false]);
  });

  it("deduplicates overlaps across all sources while preserving priority order", () => {
    const items = selectBrowseTrendingRowItems({
      trending7d: [makeItem("a"), makeItem("b")],
      trending30d: [makeItem("b"), makeItem("c")],
      newest: [makeItem("c"), makeItem("d"), makeItem("e")],
    });

    expect(items.map((item) => item.slug)).toEqual(["a", "b", "c"]);
    expect(items.map((item) => item.source)).toEqual(["7d", "7d", "30d"]);
  });

  it("uses newest fallback items without a trending badge", () => {
    const items = selectBrowseTrendingRowItems({
      trending7d: [],
      trending30d: [makeItem("a")],
      newest: [makeItem("a"), makeItem("b"), makeItem("c")],
    });

    expect(items.map((item) => item.slug)).toEqual(["a", "b", "c"]);
    expect(items.map((item) => item.isTrending)).toEqual([true, false, false]);
  });
});
