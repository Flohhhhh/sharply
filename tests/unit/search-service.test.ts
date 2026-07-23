/*
These tests protect search behavior that can quietly break user discovery.
They test the service with mocked data calls, then check which options and results flow through.
This keeps the tests fast while still proving the important search wiring works.
*/

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GearSuggestion } from "~/types/search";

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

const listingTableServiceMocks = vi.hoisted(() => ({
  attachGearListingTableFields: vi.fn(),
}));

vi.mock("~/server/search/data", () => searchDataMocks);
vi.mock("~/server/gear/data", () => gearDataMocks);
vi.mock("~/server/gear/listing-table-service", () => listingTableServiceMocks);

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
    listingTableServiceMocks.attachGearListingTableFields.mockImplementation(
      async (items: Array<{ id: string }>) =>
        items.map((item) => ({
          ...item,
          mountNames: [],
          sensorFormatName: null,
          weightGrams: null,
          focalLengthMinMm: null,
          focalLengthMaxMm: null,
          isPrime: null,
          maxApertureWide: null,
          maxApertureTele: null,
        })),
    );
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

  it("returns the shared table fields alongside existing search results", async () => {
    listingTableServiceMocks.attachGearListingTableFields.mockResolvedValueOnce(
      [
        {
          id: "gear-1",
          name: "Camera One",
          slug: "camera-one",
          brandName: "Nikon",
          gearType: "CAMERA",
          mountNames: ["Nikon Z"],
          sensorFormatName: "Full Frame",
          weightGrams: 705,
          focalLengthMinMm: null,
          focalLengthMaxMm: null,
          isPrime: null,
          maxApertureWide: null,
          maxApertureTele: null,
        },
      ],
    );

    const result = await searchGear({
      query: "nikon",
      sort: "relevance",
      page: 1,
      pageSize: 10,
    });

    expect(result.results[0]).toMatchObject({
      mountNames: ["Nikon Z"],
      sensorFormatName: "Full Frame",
      weightGrams: 705,
    });
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
      new Map([["gear-1", [{ region: "JP", name: "Lumix GF9" }]]]),
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

  it("shows a brand-independent US alias with the canonical name underneath", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Samyang AF 35mm F1.8",
        slug: "samyang-af-35mm-f1-8",
        brandName: "Samyang",
        gearType: "LENS",
        relevance: 0.95,
      },
    ]);
    gearDataMocks.fetchGearAliasesByGearIds.mockResolvedValue(
      new Map([["gear-1", [{ region: "US", name: "Rokinon AF 35mm F1.8" }]]]),
    );

    const suggestions = await getSuggestions("Rokinon AF 35mm", 8, "US");

    expect(suggestions[0]).toMatchObject({
      title: "Rokinon AF 35mm F1.8",
      subtitle: "Samyang AF 35mm F1.8",
      localizedName: "Rokinon AF 35mm F1.8",
      matchedName: "Rokinon AF 35mm F1.8",
      matchSource: "localized",
      isBestMatch: true,
    });
  });

  it("shows a matched non-local alias as the title with the viewer-local name underneath", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Canon EOS Rebel T5",
        slug: "canon-eos-rebel-t5",
        brandName: "Canon",
        gearType: "CAMERA",
        relevance: 0.93,
      },
    ]);
    gearDataMocks.fetchGearAliasesByGearIds.mockResolvedValue(
      new Map([["gear-1", [{ region: "EU", name: "Canon EOS 1200D" }]]]),
    );

    const suggestions = await getSuggestions("Canon EOS 1200D", 8, "GLOBAL");

    expect(suggestions[0]).toMatchObject({
      title: "Canon EOS 1200D",
      subtitle: "Canon EOS Rebel T5",
      canonicalName: "Canon EOS Rebel T5",
      localizedName: "Canon EOS Rebel T5",
      matchedName: "Canon EOS 1200D",
      matchSource: "alias",
      isBestMatch: true,
    });
  });

  it("uses the stored alias display text instead of the raw brand-stripped query", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Canon EOS Rebel T5i",
        slug: "canon-eos-rebel-t5i",
        brandName: "Canon",
        gearType: "CAMERA",
        relevance: 0.94,
      },
    ]);
    gearDataMocks.fetchGearAliasesByGearIds.mockResolvedValue(
      new Map([["gear-1", [{ region: "EU", name: "Canon EOS 700D" }]]]),
    );

    const suggestions = await getSuggestions("eos 700d", 8, "GLOBAL");

    expect(suggestions[0]).toMatchObject({
      title: "Canon EOS 700D",
      subtitle: "Canon EOS Rebel T5i",
      matchedName: "Canon EOS 700D",
      matchSource: "alias",
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
      new Map([["gear-1", [{ region: "JP", name: "Lumix GF9" }]]]),
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
      new Map([["gear-1", [{ region: "JP", name: "Canon EOS Kiss X9i" }]]]),
    );

    const suggestions = await getSuggestions("eos kiss", 8, "JP");

    expect(suggestions[0]).toMatchObject({
      kind: "camera",
      title: "Canon EOS Kiss X9i",
      subtitle: "Canon EOS Rebel T7i",
      matchSource: "localized",
      isBestMatch: true,
    });
  });

  it("keeps a matched non-local alias leading for partial alias matches", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Canon EOS Rebel T5",
        slug: "canon-eos-rebel-t5",
        brandName: "Canon",
        gearType: "CAMERA",
        relevance: 0.87,
      },
    ]);
    gearDataMocks.fetchGearAliasesByGearIds.mockResolvedValue(
      new Map([["gear-1", [{ region: "EU", name: "Canon EOS 1200D" }]]]),
    );

    const suggestions = await getSuggestions("1200", 8, "GLOBAL");

    expect(suggestions[0]).toMatchObject({
      kind: "camera",
      title: "Canon EOS 1200D",
      subtitle: "Canon EOS Rebel T5",
      matchedName: "Canon EOS 1200D",
      matchSource: "alias",
      isBestMatch: false,
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

  it("treats lens shorthand like 500 pf as a best match when it resolves uniquely", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Nikon AF-S NIKKOR 500mm f/5.6E PF ED VR",
        slug: "nikon-500-pf",
        brandName: "Nikon",
        gearType: "LENS",
        relevance: 0.96,
      },
    ]);

    const suggestions = await getSuggestions("500 pf", 8, "GLOBAL");

    expect(suggestions[0]).toMatchObject({
      kind: "lens",
      matchedName: "Nikon AF-S NIKKOR 500mm f/5.6E PF ED VR",
      isBestMatch: true,
    });
  });

  it("treats lens shorthand like 35mm 1.8g as a best match when it resolves uniquely", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Nikon AF-S DX NIKKOR 35mm f/1.8G",
        slug: "nikon-35mm-f18g",
        brandName: "Nikon",
        gearType: "LENS",
        relevance: 0.95,
      },
    ]);

    const suggestions = await getSuggestions("35mm 1.8g", 8, "GLOBAL");

    expect(suggestions[0]).toMatchObject({
      kind: "lens",
      matchedName: "Nikon AF-S DX NIKKOR 35mm f/1.8G",
      isBestMatch: true,
    });
  });

  it("treats a unique multi-token lens family query as a best match", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Sigma 150-600mm F5-6.3 DG OS HSM Contemporary",
        slug: "sigma-150-600mm-contemporary",
        brandName: "Sigma",
        gearType: "LENS",
        relevance: 0.94,
      },
      {
        id: "gear-2",
        name: "Sigma 150-600mm f/5-6.3 DG DN OS Sports",
        slug: "sigma-150-600mm-sports",
        brandName: "Sigma",
        gearType: "LENS",
        relevance: 0.83,
      },
    ]);

    const suggestions = await getSuggestions(
      "sigma 150-600 contemporary",
      8,
      "GLOBAL",
    );
    const gearSuggestions = suggestions.filter(
      (suggestion): suggestion is GearSuggestion =>
        suggestion.kind === "camera" || suggestion.kind === "lens",
    );

    expect(gearSuggestions[0]).toMatchObject({
      matchedName: "Sigma 150-600mm F5-6.3 DG OS HSM Contemporary",
      isBestMatch: true,
    });
    expect(gearSuggestions[1]).toMatchObject({
      matchedName: "Sigma 150-600mm f/5-6.3 DG DN OS Sports",
      isBestMatch: false,
    });
  });

  it("treats the explicit mm variant of the same lens family query as a best match", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Sigma 150-600mm F5-6.3 DG OS HSM Contemporary",
        slug: "sigma-150-600mm-contemporary",
        brandName: "Sigma",
        gearType: "LENS",
        relevance: 0.94,
      },
      {
        id: "gear-2",
        name: "Sigma 150-600mm f/5-6.3 DG DN OS Sports",
        slug: "sigma-150-600mm-sports",
        brandName: "Sigma",
        gearType: "LENS",
        relevance: 0.83,
      },
    ]);

    const suggestions = await getSuggestions(
      "sigma 150-600mm contemporary",
      8,
      "GLOBAL",
    );
    const gearSuggestions = suggestions.filter(
      (suggestion): suggestion is GearSuggestion =>
        suggestion.kind === "camera" || suggestion.kind === "lens",
    );

    expect(gearSuggestions[0]).toMatchObject({
      matchedName: "Sigma 150-600mm F5-6.3 DG OS HSM Contemporary",
      isBestMatch: true,
    });
    expect(gearSuggestions[1]).toMatchObject({
      matchedName: "Sigma 150-600mm f/5-6.3 DG DN OS Sports",
      isBestMatch: false,
    });
  });

  it("does not mark single-token partial queries as best matches just because they are unique", async () => {
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
      new Map([["gear-1", [{ region: "JP", name: "Lumix GF9" }]]]),
    );

    const suggestions = await getSuggestions("lumix", 8, "JP");

    expect(suggestions[0]).toMatchObject({
      title: "Lumix GF9",
      isBestMatch: false,
    });
  });

  it("marks only the unique exact row as best match when similar variants also match partially", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "gear-1",
        name: "Nikon Z6",
        slug: "nikon-z6",
        brandName: "Nikon",
        gearType: "CAMERA",
        relevance: 0.95,
      },
      {
        id: "gear-2",
        name: "Nikon Z6II",
        slug: "nikon-z6ii",
        brandName: "Nikon",
        gearType: "CAMERA",
        relevance: 0.92,
      },
      {
        id: "gear-3",
        name: "Nikon Z6III",
        slug: "nikon-z6iii",
        brandName: "Nikon",
        gearType: "CAMERA",
        relevance: 0.9,
      },
    ]);

    const suggestions = await getSuggestions("nikon z6", 8, "GLOBAL");
    const gearSuggestions = suggestions.filter(
      (suggestion): suggestion is GearSuggestion =>
        suggestion.kind === "camera" || suggestion.kind === "lens",
    );

    expect(gearSuggestions.map((suggestion) => suggestion.isBestMatch)).toEqual(
      [true, false, false],
    );
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

  it("gear-only mode fetches request limit gear rows and skips brands/smart-actions", async () => {
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
        name: "Z5 II",
        slug: "z5-ii",
        brandName: "Nikon",
        gearType: "CAMERA",
        relevance: 0.8,
      },
    ]);
    searchDataMocks.queryBrandSuggestions.mockResolvedValue([
      {
        id: "brand-1",
        name: "Nikon",
        slug: "nikon",
        relevance: 0.99,
      },
    ]);

    const suggestions = await getSuggestions("nikon", 12, "GLOBAL", {
      types: ["gear"],
    });

    expect(searchDataMocks.queryGearSuggestions).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      12,
    );
    expect(searchDataMocks.queryBrandSuggestions).not.toHaveBeenCalled();
    expect(suggestions).toHaveLength(2);
    expect(suggestions.every((item) => item.type === "gear")).toBe(true);
    expect(suggestions.some((item) => item.kind === "smart-action")).toBe(
      false,
    );
  });

  it("gear-only mode applies gearType filter and still uses request limit", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([
      {
        id: "lens-1",
        name: "Nikkor 50mm f/1.8",
        slug: "nikkor-50-18",
        brandName: "Nikon",
        gearType: "LENS",
        relevance: 0.9,
      },
    ]);

    const suggestions = await getSuggestions("50", 10, null, {
      types: ["gear"],
      filters: { gearType: "LENS" },
    });

    expect(searchDataMocks.queryGearSuggestions).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      10,
    );
    expect(searchDataMocks.queryBrandSuggestions).not.toHaveBeenCalled();
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      type: "gear",
      kind: "lens",
      gearType: "LENS",
    });
  });

  it("default suggest path still requests the five-gear candidate window", async () => {
    searchDataMocks.queryGearSuggestions.mockResolvedValue([]);

    await getSuggestions("sony", 8);

    expect(searchDataMocks.queryGearSuggestions).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      5,
    );
  });
});
