/*
These tests protect search behavior that can quietly break user discovery.
They test the service with mocked data calls, then check which options and results flow through.
This keeps the tests fast while still proving the important search wiring works.
*/

import { beforeEach, describe, expect, it, vi } from "vitest";

const searchDataMocks = vi.hoisted(() => ({
  buildSearchWhereClause: vi.fn(),
  buildRelevanceExpr: vi.fn(),
  querySearchRows: vi.fn(),
  querySearchTotal: vi.fn(),
  queryGearSuggestions: vi.fn(),
  queryBrandSuggestions: vi.fn(),
}));

const gearDataMocks = vi.hoisted(() => ({
  fetchGearAliasesByGearIds: vi.fn(),
}));

vi.mock("~/server/search/data", () => searchDataMocks);
vi.mock("~/server/gear/data", () => gearDataMocks);

import { getSuggestions, searchGear } from "~/server/search/service";

describe("search service high-impact behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchDataMocks.buildSearchWhereClause.mockReturnValue({ clause: "where" });
    searchDataMocks.buildRelevanceExpr.mockReturnValue({ clause: "relevance" });
    searchDataMocks.querySearchRows.mockResolvedValue([
      {
        id: "gear-1",
        name: "Camera One",
        slug: "camera-one",
        brandName: "Nikon",
        gearType: "CAMERA",
        mountValue: null,
        thumbnailUrl: null,
      },
    ]);
    searchDataMocks.querySearchTotal.mockResolvedValue(1);
    searchDataMocks.queryGearSuggestions.mockResolvedValue([]);
    searchDataMocks.queryBrandSuggestions.mockResolvedValue([]);
    gearDataMocks.fetchGearAliasesByGearIds.mockResolvedValue(new Map());
  });

  it("skips counting total when includeTotal is false", async () => {
    const result = await searchGear({
      query: "nikon",
      sort: "relevance",
      page: 1,
      pageSize: 10,
      includeTotal: false,
    });

    expect(searchDataMocks.querySearchTotal).not.toHaveBeenCalled();
    expect(result.total).toBeUndefined();
    expect(result.results).toHaveLength(1);
  });

  it("passes include flags for mount, sensor, lens, and analog filters", async () => {
    await searchGear({
      query: "nikon",
      sort: "relevance",
      page: 1,
      pageSize: 10,
      filters: {
        mount: "mount-1",
        sensorFormat: "full-frame",
        lensType: "prime",
        analogCameraType: "SLR",
      },
    });

    expect(searchDataMocks.querySearchRows).toHaveBeenCalledWith(
      expect.objectContaining({
        includeMounts: true,
        includeSensorFormats: true,
        includeLensSpecs: true,
        includeAnalogSpecs: true,
      }),
    );

    expect(searchDataMocks.querySearchTotal).toHaveBeenCalledWith(
      expect.anything(),
      true,
      true,
      true,
      true,
    );
  });

  it("returns no suggestions for very short queries", async () => {
    const suggestions = await getSuggestions("a");

    expect(suggestions).toEqual([]);
    expect(searchDataMocks.queryGearSuggestions).not.toHaveBeenCalled();
    expect(searchDataMocks.queryBrandSuggestions).not.toHaveBeenCalled();
  });

  it("merges, sorts by relevance, and limits mixed gear + brand suggestions", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Z6 III",
        slug: "z6-iii",
        brandName: "Nikon",
        relevance: 0.95,
      },
      {
        id: "gear-2",
        name: "A7 IV",
        slug: "a7-iv",
        brandName: "Sony",
        relevance: 0.2,
      },
    ]);
    searchDataMocks.queryBrandSuggestions.mockResolvedValue([
      {
        id: "brand-1",
        name: "Sony",
        slug: "sony",
        relevance: 0.7,
      },
    ]);

    const suggestions = await getSuggestions("sony", 2);

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]).toMatchObject({
      id: "gear:gear-1",
      type: "gear",
      href: "/gear/z6-iii",
    });
    expect(suggestions[1]).toMatchObject({
      id: "brand:brand-1",
      type: "brand",
      href: "/brand/sony",
    });
  });
});

