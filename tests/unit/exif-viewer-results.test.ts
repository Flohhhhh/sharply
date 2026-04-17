import { describe, expect, it } from "vitest";
import {
  buildSummaryItems,
  getNumberFlowSeed,
  resolveHeroMetric,
} from "../../src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-results";
import type {
  ExifViewerMetadataRow,
  ExifViewerResponse,
} from "../../src/app/(app)/(pages)/(tools)/exif-viewer/types";

function metadataRow(
  key: string,
  value: string,
  group = key.split(":")[0] ?? "Unknown",
  tag = key.split(":").slice(1).join(":") || key,
): ExifViewerMetadataRow {
  return {
    key,
    group,
    tag,
    value,
  };
}

function createResponse(
  overrides: Partial<ExifViewerResponse> = {},
): ExifViewerResponse {
  return {
    ok: true,
    status: "success",
    message: "Shutter count found.",
    file: {
      name: "sample.nef",
      extension: "nef",
      size: 1024,
    },
    camera: {
      make: "Nikon",
      model: "Z6III",
      normalizedBrand: "nikon",
    },
    extractor: {
      selected: "nikon",
      primary: "nikon",
      fallbackUsed: false,
      countType: "total",
      sourceTag: "Nikon:ShutterCount",
      mechanicalSourceTag: "Nikon:MechanicalShutterCount",
      shutterCount: 9377,
      totalShutterCount: 9377,
      mechanicalShutterCount: 4000,
      failureReason: null,
      candidateTagsChecked: [],
      rawValuesInspected: [],
      ...overrides.extractor,
    },
    tracking: {
      eligible: true,
      reason: null,
      saveToken: "token",
      matchedGear: null,
      trackedCamera: null,
      currentReadingSaved: false,
      ...overrides.tracking,
    },
    metadata: {
      rows: [
        metadataRow("Composite:LensID", "NIKKOR Z 24-70mm f/4 S"),
        metadataRow(
          "Composite:SubSecDateTimeOriginal",
          "2024:10:02 18:45:12-04:00",
        ),
        metadataRow("Composite:ShutterSpeed", "1/1000"),
        metadataRow("Composite:Aperture", "4"),
        metadataRow("EXIF:ISO", "640"),
      ],
      ...overrides.metadata,
    },
    debug: {
      parser: "exiftool-vendored",
      tagCount: 5,
      warnings: [],
      relevantTags: [],
      attempts: [],
      ...overrides.debug,
    },
    ...overrides,
  };
}

describe("exif viewer result helpers", () => {
  it("prefers total count as the hero and keeps mechanical as secondary", () => {
    const hero = resolveHeroMetric(createResponse());

    expect(hero).toEqual({
      label: "Total Shutter Count",
      value: 9377,
      secondaryLabel: "Mechanical Shutter Count",
      secondaryValue: 4000,
    });
  });

  it("shows only the total count when no mechanical count exists", () => {
    const hero = resolveHeroMetric(
      createResponse({
        extractor: {
          mechanicalShutterCount: null,
          mechanicalSourceTag: null,
        } as ExifViewerResponse["extractor"],
      }),
    );

    expect(hero?.label).toBe("Total Shutter Count");
    expect(hero?.secondaryValue).toBeNull();
  });

  it("uses mechanical count as the hero when it is the only count available", () => {
    const hero = resolveHeroMetric(
      createResponse({
        extractor: {
          countType: null,
          sourceTag: null,
          shutterCount: null,
          totalShutterCount: null,
          mechanicalShutterCount: 9371,
        } as ExifViewerResponse["extractor"],
      }),
    );

    expect(hero).toEqual({
      label: "Mechanical Shutter Count",
      value: 9371,
      secondaryLabel: null,
      secondaryValue: null,
    });
  });

  it("uses a generic shutter count label for generic extractor results", () => {
    const hero = resolveHeroMetric(
      createResponse({
        camera: {
          make: "Leica",
          model: "Q3",
          normalizedBrand: "unknown",
        },
        extractor: {
          selected: "generic",
          primary: null,
          fallbackUsed: false,
          countType: "total",
          sourceTag: "Composite:ImageCount",
          mechanicalSourceTag: null,
          shutterCount: 88,
          totalShutterCount: 88,
          mechanicalShutterCount: null,
          failureReason: null,
          candidateTagsChecked: [],
          rawValuesInspected: [],
        },
      }),
    );

    expect(hero).toEqual({
      label: "Shutter Count",
      value: 88,
      secondaryLabel: null,
      secondaryValue: null,
    });
  });

  it("returns null when no usable count exists", () => {
    expect(
      resolveHeroMetric(
        createResponse({
          ok: false,
          status: "not_found",
          message: "No shutter count tag was found.",
          extractor: {
            countType: null,
            sourceTag: null,
            mechanicalSourceTag: null,
            shutterCount: null,
            totalShutterCount: null,
            mechanicalShutterCount: null,
            failureReason: "No shutter count tag was found.",
          } as ExifViewerResponse["extractor"],
        }),
      ),
    ).toBeNull();
  });

  it("builds summary items from metadata rows with formatting", () => {
    const summary = buildSummaryItems(createResponse());

    expect(summary).toEqual([
      { label: "Camera Model", value: "Z6III" },
      { label: "Lens", value: "NIKKOR Z 24-70mm f/4 S" },
      {
        label: "Capture Date",
        value: new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date("2024-10-02T18:45:12-04:00")),
      },
      { label: "Exposure Time", value: "1/1000" },
      { label: "Aperture", value: "f/4" },
      { label: "ISO", value: "ISO 640" },
    ]);
  });

  it("falls back to em dashes for missing summary values", () => {
    const summary = buildSummaryItems(
      createResponse({
        camera: {
          make: null,
          model: null,
          normalizedBrand: "unknown",
        },
        metadata: {
          rows: [],
        },
      }),
    );

    expect(summary).toEqual([
      { label: "Camera Model", value: "—" },
      { label: "Lens", value: "—" },
      { label: "Capture Date", value: "—" },
      { label: "Exposure Time", value: "—" },
      { label: "Aperture", value: "—" },
      { label: "ISO", value: "—" },
    ]);
  });

  it("uses a deterministic number-flow seed based on digit count", () => {
    expect(getNumberFlowSeed(9377)).toBe(1000);
    expect(getNumberFlowSeed(81)).toBe(10);
    expect(getNumberFlowSeed(7)).toBe(0);
  });
});
