import { describe, expect, it } from "vitest";
import {
  compactValue,
  extractExifToolJsonTagMap,
  filterRelevantExifToolTags,
  normalizeExifToolTagEntries,
  sanitizeExifViewerTagEntries,
  toExifViewerMetadataRows,
} from "../../src/app/(app)/(pages)/(tools)/exif-viewer/parse/exiftool";

describe("exif viewer exiftool normalization", () => {
  it("extracts tag maps and warning strings from JSON output", () => {
    const extracted = extractExifToolJsonTagMap([
      {
        SourceFile: "sample.nef",
        "EXIF:Make": "NIKON CORPORATION",
        "EXIF:Model": "Zf",
        "Nikon:MechanicalShutterCount": 9371,
        "ExifTool:Warning": "Minor warning",
      },
    ]);

    expect(extracted.warnings).toEqual(["Minor warning"]);
    expect(extracted.rawTags).toEqual({
      SourceFile: "sample.nef",
      "EXIF:Make": "NIKON CORPORATION",
      "EXIF:Model": "Zf",
      "Nikon:MechanicalShutterCount": 9371,
    });
  });

  it("normalizes raw exiftool tags into viewer tag entries and filters relevant tags", () => {
    const allTags = normalizeExifToolTagEntries({
      "EXIF:Make": "SONY",
      "EXIF:Model": "ILCE-7M4",
      "Sony:ShutterCount": "5432",
      "File:FileType": "ARW",
    });

    expect(allTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "File:FileType",
          group: "File",
          tag: "FileType",
          value: "ARW",
        }),
      ]),
    );
    expect(filterRelevantExifToolTags(allTags)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "Sony:ShutterCount",
          group: "Sony",
          tag: "ShutterCount",
          value: "5432",
        }),
      ]),
    );
  });

  it("formats full metadata rows from normalized tag entries", () => {
    const rows = toExifViewerMetadataRows(
      normalizeExifToolTagEntries({
        "EXIF:Make": "SONY",
        "Composite:LensSpec": ["24-70mm", "f/2.8"],
      }),
    );

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "EXIF:Make",
          value: "SONY",
        }),
        expect.objectContaining({
          key: "Composite:LensSpec",
          value: "24-70mm, f/2.8",
        }),
      ]),
    );
  });

  it("compacts nested values and re-sanitizes client tag entries", () => {
    const longString = "x".repeat(240);
    const compacted = compactValue({
      alpha: longString,
      beta: [longString, { gamma: longString }],
    });
    const sanitized = sanitizeExifViewerTagEntries([
      {
        key: "Composite:NestedValue",
        group: "Composite",
        tag: "NestedValue",
        value: compacted,
      },
    ]);

    expect(sanitized).toEqual([
      {
        key: "Composite:NestedValue",
        group: "Composite",
        tag: "NestedValue",
        value: {
          alpha: `${"x".repeat(200)}...`,
          beta: [
            `${"x".repeat(200)}...`,
            {
              gamma: `${"x".repeat(200)}...`,
            },
          ],
        },
      },
    ]);
  });
});
