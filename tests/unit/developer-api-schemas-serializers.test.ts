import { describe, expect, it } from "vitest";
import { DeveloperApiError } from "~/server/developer-api/errors";
import {
  serializeDeveloperApiSpecs,
  serializeGear,
  serializeSuggestions,
} from "~/server/developer-api/serializers";
import {
  parseSearchParams,
  parseSpecSelectors,
  parseSuggestionParams,
} from "~/server/developer-api/schemas";

describe("developer API request schemas", () => {
  it("uses bounded defaults for search", () => {
    expect(parseSearchParams(new URLSearchParams("q=Nikon+Z6"))).toEqual({
      query: "Nikon Z6",
      page: 1,
      limit: 20,
    });
  });

  it("rejects invalid public query values", () => {
    expect(() =>
      parseSearchParams(new URLSearchParams("q=x&limit=26")),
    ).toThrow(DeveloperApiError);
    expect(() =>
      parseSuggestionParams(new URLSearchParams("q=Z6&region=US")),
    ).toThrow(DeveloperApiError);
    expect(() => parseSpecSelectors(new URLSearchParams())).toThrow(
      DeveloperApiError,
    );
  });

  it("parses bounded spec field and category selectors", () => {
    expect(
      parseSpecSelectors(
        new URLSearchParams("fields=camera.sensor,camera.sensor.isoRange"),
      ),
    ).toEqual(["camera.sensor", "camera.sensor.isoRange"]);
  });
});

describe("developer API serializers", () => {
  it("removes website-only smart actions from suggestions", () => {
    const response = serializeSuggestions([
      {
        id: "gear:1",
        kind: "camera",
        type: "gear",
        href: "/gear/nikon-z6-iii",
        title: "Nikon Z6 III",
        label: "Nikon Z6 III",
        gearId: "1",
        brandName: "Nikon",
        canonicalName: "Nikon Z6 III",
        localizedName: "Nikon Z6 III",
        matchedName: "Nikon Z6 III",
        matchSource: "canonical",
        isBestMatch: true,
        gearType: "CAMERA",
      },
      {
        id: "compare:1",
        kind: "smart-action",
        type: "smart-action",
        href: "/compare",
        title: "Compare",
        label: "Compare",
        action: "compare",
        compareSlugs: ["a", "b"],
        compareTitles: ["A", "B"],
      },
    ]);

    expect(response.data).toEqual([
      expect.objectContaining({
        kind: "gear",
        slug: "nikon-z6-iii",
        isBestMatch: true,
      }),
    ]);
  });

  it("serializes full gear data while excluding database implementation fields", () => {
    const response = serializeGear({
      id: "internal-id",
      brandId: "brand-id",
      mountId: "legacy-mount",
      searchName: "nikon z6",
      slug: "nikon-z6",
      name: "Nikon Z6",
      gearType: "CAMERA",
      publicationState: "PUBLISHED",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      brands: {
        id: "brand-id",
        name: "Nikon",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      },
      cameraSpecs: {
        gearId: "internal-id",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      },
      cameraCardSlots: [
        {
          id: "card-slot-id",
          gearId: "internal-id",
          slotIndex: 1,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-02T00:00:00.000Z"),
        },
      ],
      videoModes: [
        {
          id: "video-mode-1",
          gearId: "internal-id",
          resolutionLabel: "4K",
          fps: 60,
        },
      ],
      rawSamples: [
        {
          id: "sample-1",
          fileUrl: "https://example.test/sample.nef",
          uploadedByUserId: "user-1",
          isDeleted: false,
          deletedAt: null,
        },
      ],
    } as never);

    expect(response.data).toMatchObject({
      slug: "nikon-z6",
      brands: { name: "Nikon" },
      cameraSpecs: { gearId: "internal-id" },
      cameraCardSlots: [{ gearId: "internal-id", slotIndex: 1 }],
    });
    expect(response.data).not.toHaveProperty("id");
    expect(response.data).not.toHaveProperty("createdAt");
    expect(response.data).not.toHaveProperty("updatedAt");
    expect(response.data).not.toHaveProperty("searchName");
    expect(response.data).not.toHaveProperty("videoModes");
    expect(response.data).not.toHaveProperty("brands.id");
    expect(response.data).not.toHaveProperty("brands.createdAt");
    expect(response.data).not.toHaveProperty("cameraSpecs.createdAt");
    expect(response.data).not.toHaveProperty("cameraCardSlots.0.id");
    expect(response.data).not.toHaveProperty("cameraCardSlots.0.updatedAt");
    expect(response.data).not.toHaveProperty("rawSamples.0.uploadedByUserId");
  });

  it("serializes selected specs with structured raw values", () => {
    expect(
      serializeDeveloperApiSpecs([
        {
          id: "camera.sensor.isoRange",
          raw: { min: 100, max: 51200 },
          display: "ISO 100 - 51200",
        },
      ]),
    ).toEqual({
      data: [
        {
          id: "camera.sensor.isoRange",
          raw: { min: 100, max: 51200 },
          display: "ISO 100 - 51200",
        },
      ],
    });
  });
});
