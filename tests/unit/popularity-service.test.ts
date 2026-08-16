import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const nextHeaderMocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

const dbMocks = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
  },
}));

const popularityDataMocks = vi.hoisted(() => ({
  fetchHighTrafficGearSlugsData: vi.fn(),
  fetchTopComparePairs: vi.fn(),
  getLiveTrendingSnapshot: vi.fn(),
  getTrendingData: vi.fn(),
  getTrendingTotalCount: vi.fn(),
  hasEventForIdentityToday: vi.fn(),
  hasViewEventForIdentityToday: vi.fn(),
  incrementComparePairCountBySlugs: vi.fn(),
  insertCompareAddEvent: vi.fn(),
  insertViewEvent: vi.fn(),
}));

const gearDataMocks = vi.hoisted(() => ({
  fetchGearAliasesByGearIds: vi.fn(),
}));

const popularityLiveMocks = vi.hoisted(() => ({
  applyLiveBoostToTrending: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/auth", () => authMocks);
vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("next/headers", () => nextHeaderMocks);
vi.mock("~/server/db", () => dbMocks);
vi.mock("~/server/db/schema", () => ({
  gear: {
    id: "id",
    slug: "slug",
  },
}));
vi.mock("~/server/gear/data", () => gearDataMocks);
vi.mock("~/server/popularity/data", () => popularityDataMocks);
vi.mock("~/server/popularity/live", () => popularityLiveMocks);

import {
  fetchTrending,
  fetchTrendingSlugs,
  getLiveTrendingStatusForSlugs,
  recordGearView,
} from "~/server/popularity/service";

const baselineItem = {
  gearId: "gear-baseline",
  slug: "baseline-camera",
  score: 10,
};

const liveSnapshot = {
  items: [{ gearId: "gear-live", slug: "live-camera", liveScore: 20 }],
};

describe("popularity service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gearDataMocks.fetchGearAliasesByGearIds.mockResolvedValue(new Map());
  });

  it("keeps the UA denylist skip path for known crawlers", async () => {
    const result = await recordGearView({
      slug: "nikon-zf",
      userAgent:
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://google.com/bot.html)",
    });

    expect(result).toEqual({
      success: true,
      deduped: false,
      skipped: "bot",
    });
    expect(dbMocks.db.select).not.toHaveBeenCalled();
    expect(authMocks.auth.api.getSession).not.toHaveBeenCalled();
    expect(popularityDataMocks.insertViewEvent).not.toHaveBeenCalled();
  });

  it("reads baseline rankings only for server-rendered badge slugs", async () => {
    popularityDataMocks.getTrendingData.mockResolvedValue([baselineItem]);

    await expect(
      fetchTrendingSlugs({ timeframe: "30d", limit: 20 }),
    ).resolves.toEqual(["baseline-camera"]);

    expect(popularityDataMocks.getTrendingData).toHaveBeenCalledWith(
      "30d",
      20,
      {},
      0,
    );
    expect(popularityDataMocks.getLiveTrendingSnapshot).not.toHaveBeenCalled();
    expect(popularityLiveMocks.applyLiveBoostToTrending).not.toHaveBeenCalled();
  });

  it("still merges baseline and live data for full trending results", async () => {
    const mergedItem = { ...baselineItem, slug: "live-camera" };
    popularityDataMocks.getTrendingData.mockResolvedValue([baselineItem]);
    popularityDataMocks.getLiveTrendingSnapshot.mockResolvedValue(liveSnapshot);
    popularityLiveMocks.applyLiveBoostToTrending.mockReturnValue([mergedItem]);

    const result = await fetchTrending({ timeframe: "7d", limit: 1 });

    expect(popularityLiveMocks.applyLiveBoostToTrending).toHaveBeenCalledWith({
      baseline: [baselineItem],
      liveSnapshot,
    });
    expect(result[0]).toMatchObject({ slug: "live-camera" });
  });

  it("uses merged rankings for hydrated live badge checks", async () => {
    const merged = [
      { ...baselineItem, slug: "live-camera", score: 30 },
      baselineItem,
    ];
    popularityDataMocks.getTrendingData.mockResolvedValue([baselineItem]);
    popularityDataMocks.getLiveTrendingSnapshot.mockResolvedValue(liveSnapshot);
    popularityLiveMocks.applyLiveBoostToTrending.mockReturnValue(merged);

    const result = await getLiveTrendingStatusForSlugs(
      ["baseline-camera", "live-camera", "other-camera"],
      { timeframe: "30d", limit: 1 },
    );

    expect(result).toEqual(new Set(["live-camera"]));
  });
});
