/*
These tests protect how live trending data is merged into baseline rankings.
They verify score math, live-only entries, sort order, and result limits with fixed input data.
If this breaks, the trending list users see can become misleading.
*/

import { describe,expect,it } from "vitest";
import { applyLiveBoostToTrending } from "~/server/popularity/live";

function makeBaseline(overrides?: Partial<any>) {
  return {
    gearId: "gear-1",
    slug: "gear-1",
    name: "Gear One",
    brandName: "Nikon",
    gearType: "CAMERA" as const,
    thumbnailUrl: null,
    releaseDate: null,
    releaseDatePrecision: null,
    announcedDate: null,
    announceDatePrecision: null,
    msrpNowUsdCents: null,
    mpbMaxPriceUsdCents: null,
    lifetimeViews: 100,
    score: 10,
    stats: {
      views: 10,
      wishlistAdds: 2,
      ownerAdds: 1,
      compareAdds: 0,
      reviewSubmits: 1,
    },
    asOfDate: "2026-03-06",
    ...overrides,
  };
}

function makeLiveItem(overrides?: Partial<any>) {
  return {
    gearId: "gear-1",
    slug: "gear-1",
    name: "Gear One",
    brandName: "Nikon",
    gearType: "CAMERA" as const,
    thumbnailUrl: null,
    releaseDate: null,
    releaseDatePrecision: null,
    announcedDate: null,
    announceDatePrecision: null,
    msrpNowUsdCents: null,
    mpbMaxPriceUsdCents: null,
    lifetimeViews: 100,
    liveScore: 3,
    stats: {
      views: 5,
      wishlistAdds: 1,
      ownerAdds: 0,
      compareAdds: 0,
      reviewSubmits: 0,
    },
    asOfDate: "2026-03-06",
    ...overrides,
  };
}

describe("live trending merge behavior", () => {
  it("adds live score to matching baseline items", () => {
    const merged = applyLiveBoostToTrending({
      baseline: [makeBaseline()],
      liveSnapshot: {
        generatedAt: "2026-03-06T00:00:00.000Z",
        items: [makeLiveItem()],
      },
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      score: 13,
      liveBoost: 3,
      liveOnly: false,
    });
  });

  it("appends live-only items that were not in baseline", () => {
    const merged = applyLiveBoostToTrending({
      baseline: [makeBaseline()],
      liveSnapshot: {
        generatedAt: "2026-03-06T00:00:00.000Z",
        items: [makeLiveItem({ gearId: "gear-2", slug: "gear-2", liveScore: 7 })],
      },
    });

    const liveOnly = merged.find((item) => item.gearId === "gear-2");
    expect(liveOnly).toMatchObject({
      gearId: "gear-2",
      score: 7,
      liveBoost: 7,
      liveOnly: true,
    });
  });

  it("sorts merged results by score descending", () => {
    const merged = applyLiveBoostToTrending({
      baseline: [makeBaseline({ gearId: "low", score: 1 }), makeBaseline({ gearId: "high", score: 5 })],
      liveSnapshot: {
        generatedAt: "2026-03-06T00:00:00.000Z",
        items: [
          makeLiveItem({ gearId: "low", slug: "low", liveScore: 10 }),
          makeLiveItem({ gearId: "high", slug: "high", liveScore: 0 }),
        ],
      },
    });

    expect(merged.map((item) => item.gearId)).toEqual(["low", "high"]);
    expect(merged.map((item) => item.score)).toEqual([11, 5]);
  });

  it("applies limit after merging and sorting", () => {
    const merged = applyLiveBoostToTrending({
      baseline: [
        makeBaseline({ gearId: "g1", score: 1 }),
        makeBaseline({ gearId: "g2", score: 2 }),
        makeBaseline({ gearId: "g3", score: 3 }),
      ],
      limit: 2,
    });

    expect(merged).toHaveLength(2);
    expect(merged.map((item) => item.gearId)).toEqual(["g3", "g2"]);
  });
});
