import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchServiceMocks = vi.hoisted(() => ({
  searchGear: vi.fn(),
}));

vi.mock("~/server/search/service", () => searchServiceMocks);

import { GET } from "~/app/api/search/route";

describe("search route filter parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchServiceMocks.searchGear.mockResolvedValue({
      results: [],
      page: 1,
      pageSize: 20,
    });
  });

  it("normalizes reversed numeric ranges and forwards valid specification filters", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/search?megapixelsMin=60&megapixelsMax=24&isoMin=25600&isoMax=100&focalIncludes=85&widestFocalMax=35&longestFocalMin=120&fastestApertureMax=2.8&hasAutofocus=true&hasStabilization=true&hasIbis=true&hasWeatherSealing=true",
      ),
    );

    expect(response.status).toBe(200);
    expect(searchServiceMocks.searchGear).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          megapixelsMin: 24,
          megapixelsMax: 60,
          isoMin: 100,
          isoMax: 25_600,
          focalIncludes: 85,
          widestFocalMax: 35,
          longestFocalMin: 120,
          fastestApertureMax: 2.8,
          hasAutofocus: true,
          hasStabilization: true,
          hasIbis: true,
          hasWeatherSealing: true,
        }),
      }),
    );
  });

  it("drops invalid and non-positive specification filter values", async () => {
    await GET(
      new NextRequest(
        "http://localhost/api/search?focalIncludes=0&fastestApertureMax=-1&isoMin=bad&hasIbis=false",
      ),
    );

    expect(searchServiceMocks.searchGear).toHaveBeenCalledWith(
      expect.objectContaining({ filters: undefined }),
    );
  });
});
