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
        gearType: "CAMERA",
        relevance: 0.95,
      },
      {
        id: "gear-2",
        name: "A7 IV",
        slug: "a7-iv",
        brandName: "Sony",
        gearType: "CAMERA",
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
      kind: "camera",
      href: "/gear/z6-iii",
      title: "Z6 III",
    });
    expect(suggestions[1]).toMatchObject({
      id: "brand:brand-1",
      kind: "brand",
      href: "/brand/sony",
      subtitle: "Brand",
    });
  });

  it("shows the regional display name with canonical underneath for a unique exact alias hit", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Panasonic GX850",
        slug: "panasonic-gx850",
        brandName: "Panasonic",
        gearType: "CAMERA",
        relevance: 0.91,
      },
    ]);
    gearDataMocks.fetchGearAliasesByGearIds.mockResolvedValue(
      new Map([
        [
          "gear-1",
          [{ region: "JP", name: "Lumix GF9" }],
        ],
      ]),
    );

    const suggestions = await getSuggestions("Lumix GF9", 8, "JP");

    expect(suggestions[0]).toMatchObject({
      title: "Lumix GF9",
      subtitle: "Panasonic GX850",
      canonicalName: "Panasonic GX850",
      localizedName: "Lumix GF9",
      matchedName: "Lumix GF9",
      matchSource: "localized",
      isBestMatch: true,
    });
  });

  it("shows the canonical name as subtitle when the localized result name differs", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Panasonic GX850",
        slug: "panasonic-gx850",
        brandName: "Panasonic",
        gearType: "CAMERA",
        relevance: 0.82,
      },
    ]);
    gearDataMocks.fetchGearAliasesByGearIds.mockResolvedValue(
      new Map([
        [
          "gear-1",
          [{ region: "JP", name: "Lumix GF9" }],
        ],
      ]),
    );

    const suggestions = await getSuggestions("lumix", 8, "JP");

    expect(suggestions[0]).toMatchObject({
      kind: "camera",
      title: "Lumix GF9",
      subtitle: "Panasonic GX850",
    });
  });

  it("keeps the regional display name visible for partial alias matches", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Canon EOS Rebel T7i",
        slug: "canon-eos-rebel-t7i",
        brandName: "Canon",
        gearType: "CAMERA",
        relevance: 0.88,
      },
    ]);
    gearDataMocks.fetchGearAliasesByGearIds.mockResolvedValue(
      new Map([
        [
          "gear-1",
          [{ region: "JP", name: "Canon EOS Kiss X9i" }],
        ],
      ]),
    );

    const suggestions = await getSuggestions("eos kiss", 8, "JP");

    expect(suggestions[0]).toMatchObject({
      kind: "camera",
      title: "Canon EOS Kiss X9i",
      subtitle: "Canon EOS Rebel T7i",
      matchSource: "localized",
    });
  });

  it("falls back to the gear type when the visible title already matches canonical", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Nikon Z6 III",
        slug: "nikon-z6-iii",
        brandName: "Nikon",
        gearType: "CAMERA",
        relevance: 0.9,
      },
    ]);

    const suggestions = await getSuggestions("z6 iii", 8, "GLOBAL");

    expect(suggestions[0]).toMatchObject({
      kind: "camera",
      title: "Nikon Z6 III",
      subtitle: "Camera",
    });
  });

  it("prepends a compare smart action when both sides resolve strongly", async () => {
    searchDataMocks.queryGearSuggestions
      .mockResolvedValueOnce([
        {
          id: "gear-left",
          name: "Nikon Z50 II",
          slug: "nikon-z50-ii",
          brandName: "Nikon",
          gearType: "CAMERA",
          relevance: 0.97,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "gear-right",
          name: "Sony A6700",
          slug: "sony-a6700",
          brandName: "Sony",
          gearType: "CAMERA",
          relevance: 0.95,
        },
      ])
      .mockResolvedValueOnce([]);
    searchDataMocks.queryBrandSuggestions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    gearDataMocks.fetchGearAliasesByGearIds
      .mockResolvedValueOnce(new Map())
      .mockResolvedValueOnce(new Map())
      .mockResolvedValueOnce(new Map());

    const suggestions = await getSuggestions("z50 ii vs a6700");

    expect(suggestions[0]).toMatchObject({
      kind: "smart-action",
      action: "compare",
      compareSlugs: ["nikon-z50-ii", "sony-a6700"],
      href: "/compare?i=nikon-z50-ii&i=sony-a6700",
    });
  });
});
