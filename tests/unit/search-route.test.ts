import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchServiceMocks = vi.hoisted(() => ({
  searchGear: vi.fn(),
  fetchPublicTagOptions: vi.fn(),
}));

vi.mock("~/server/search/service", () => searchServiceMocks);
vi.mock("~/server/tags/service", () => ({
  fetchPublicTagOptions: searchServiceMocks.fetchPublicTagOptions,
}));

import { GET } from "~/app/api/search/route";

describe("search route filter parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchServiceMocks.searchGear.mockResolvedValue({
      results: [],
      page: 1,
      pageSize: 20,
    });
    searchServiceMocks.fetchPublicTagOptions.mockResolvedValue([
      { id: "tag-1", name: "Wildlife", slug: "wildlife", icon: null },
      { id: "tag-2", name: "Travel", slug: "travel", icon: null },
    ]);
  });

  it("normalizes reversed numeric ranges and forwards valid specification filters", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/search?priceMin=1000&priceMax=500&megapixelsMin=60&megapixelsMax=24&isoMin=25600&isoMax=100&focalIncludes=85&widestFocalMax=35&longestFocalMin=120&fastestApertureMax=2.8&hasAutofocus=true&hasStabilization=true&hasIbis=true&hasWeatherSealing=true",
      ),
    );

    expect(response.status).toBe(200);
    expect(searchServiceMocks.searchGear).toHaveBeenCalledWith(
      expect.objectContaining({
        includeConstructionState: true,
        filters: expect.objectContaining({
          priceMin: 500,
          priceMax: 1000,
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
      expect.objectContaining({
        includeConstructionState: true,
        filters: undefined,
      }),
    );
  });

  it("normalizes uppercase gearType values from smart-search URLs", async () => {
    await GET(new NextRequest("http://localhost/api/search?gearType=LENS"));

    expect(searchServiceMocks.searchGear).toHaveBeenCalledWith(
      expect.objectContaining({
        includeConstructionState: true,
        filters: expect.objectContaining({
          gearType: "LENS",
        }),
      }),
    );
  });

  it("forwards unique, non-empty repeated tag slugs", async () => {
    await GET(
      new NextRequest(
        "http://localhost/api/search?tag=wildlife&tag=&tag=travel&tag=wildlife",
      ),
    );

    expect(searchServiceMocks.searchGear).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          tags: ["wildlife", "travel"],
        }),
      }),
    );
  });

  it("drops unknown and unlisted tag slugs", async () => {
    await GET(
      new NextRequest(
        "http://localhost/api/search?tag=unknown&tag=wildlife&tag=private",
      ),
    );

    expect(searchServiceMocks.searchGear).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: { tags: ["wildlife"] },
      }),
    );
  });

  it("omits the tag filter when no requested slugs are listed", async () => {
    await GET(new NextRequest("http://localhost/api/search?tag=unknown"));

    expect(searchServiceMocks.searchGear).toHaveBeenCalledWith(
      expect.objectContaining({ filters: undefined }),
    );
  });
});
