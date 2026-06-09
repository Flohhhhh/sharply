import { beforeEach,describe,expect,it,vi } from "vitest";

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
vi.mock("~/server/gear/data", () => ({
  fetchGearAliasesByGearIds: vi.fn(),
}));
vi.mock("~/server/popularity/data", () => popularityDataMocks);
vi.mock("~/server/popularity/live", () => ({
  applyLiveBoostToTrending: vi.fn(),
}));

import { recordGearView } from "~/server/popularity/service";

describe("popularity service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the UA denylist skip path for known crawlers", async () => {
    const result = await recordGearView({
      slug: "nikon-zf",
      userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://google.com/bot.html)",
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
});
