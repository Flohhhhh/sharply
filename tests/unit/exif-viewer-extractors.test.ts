import { describe, expect, it } from "vitest";
import {
  detectCameraBrand,
  extractShutterCount,
} from "../../src/app/[locale]/(pages)/(tools)/exif-viewer/parse/extractors";
import type { ExifViewerTagEntry } from "../../src/app/[locale]/(pages)/(tools)/exif-viewer/types";

function tag(
  key: string,
  value: unknown,
  group = key.includes(":") ? key.split(":")[0]! : "Unknown",
  tagName = key.includes(":") ? key.split(":").slice(1).join(":") : key,
): ExifViewerTagEntry {
  return {
    key,
    group,
    tag: tagName,
    value,
  };
}

describe("exif viewer extractors", () => {
  it("resolves Sony maker-note shutter count", () => {
    const result = extractShutterCount([
      tag("EXIF:Make", "SONY"),
      tag("EXIF:Model", "ILCE-7M4"),
      tag("Sony:ShutterCount", "4321"),
    ]);

    expect(result.status).toBe("success");
    expect(result.camera.normalizedBrand).toBe("sony");
    expect(result.selectedExtractor).toBe("sony");
    expect(result.shutterCount).toBe(4321);
    expect(result.sourceTag).toBe("Sony:ShutterCount");
  });

  it("resolves Nikon total shutter count and retains mechanical count separately", () => {
    const result = extractShutterCount([
      tag("EXIF:Make", "NIKON CORPORATION"),
      tag("EXIF:Model", "Zf"),
      tag("Nikon:ShutterCount", 12789),
      tag("Nikon:MechanicalShutterCount", 9371),
    ]);

    expect(result.status).toBe("success");
    expect(result.camera.normalizedBrand).toBe("nikon");
    expect(result.selectedExtractor).toBe("nikon");
    expect(result.shutterCount).toBe(12789);
    expect(result.countType).toBe("total");
    expect(result.totalShutterCount).toBe(12789);
    expect(result.mechanicalShutterCount).toBe(9371);
    expect(result.sourceTag).toBe("Nikon:ShutterCount");
    expect(result.mechanicalSourceTag).toBe("Nikon:MechanicalShutterCount");
  });

  it("keeps Nikon mechanical count separate when total count is unavailable", () => {
    const result = extractShutterCount([
      tag("EXIF:Make", "NIKON CORPORATION"),
      tag("EXIF:Model", "Zf"),
      tag("Nikon:MechanicalShutterCount", 9371),
    ]);

    expect(result.status).toBe("success");
    expect(result.camera.normalizedBrand).toBe("nikon");
    expect(result.selectedExtractor).toBe("nikon");
    expect(result.countType).toBeNull();
    expect(result.shutterCount).toBeNull();
    expect(result.totalShutterCount).toBeNull();
    expect(result.mechanicalShutterCount).toBe(9371);
    expect(result.sourceTag).toBeNull();
    expect(result.mechanicalSourceTag).toBe("Nikon:MechanicalShutterCount");
  });

  it("resolves Canon shutter count from file-info style tag names", () => {
    const result = extractShutterCount([
      tag("EXIF:Make", "Canon"),
      tag("EXIF:Model", "EOS R5"),
      tag("FileInfo:ShutterCount", "999"),
    ]);

    expect(result.status).toBe("success");
    expect(result.camera.normalizedBrand).toBe("canon");
    expect(result.selectedExtractor).toBe("canon");
    expect(result.shutterCount).toBe(999);
  });

  it("resolves Fujifilm exposure count", () => {
    const result = extractShutterCount([
      tag("EXIF:Make", "FUJIFILM"),
      tag("EXIF:Model", "X-T5"),
      tag("FujiFilm:ExposureCount", "123"),
    ]);

    expect(result.status).toBe("success");
    expect(result.camera.normalizedBrand).toBe("fujifilm");
    expect(result.selectedExtractor).toBe("fujifilm");
    expect(result.shutterCount).toBe(123);
  });

  it("falls back to the generic extractor for unknown brands", () => {
    const result = extractShutterCount([
      tag("EXIF:Make", "Leica"),
      tag("EXIF:Model", "Q3"),
      tag("Composite:ImageCount", "77"),
    ]);

    expect(result.status).toBe("success");
    expect(result.camera.normalizedBrand).toBe("unknown");
    expect(result.selectedExtractor).toBe("generic");
    expect(result.fallbackUsed).toBe(false);
    expect(result.shutterCount).toBe(77);
  });

  it("falls back to the generic extractor when the brand extractor misses", () => {
    const result = extractShutterCount([
      tag("EXIF:Make", "SONY"),
      tag("EXIF:Model", "ILCE-7M4"),
      tag("Composite:ImageCount", "88"),
    ]);

    expect(result.status).toBe("success");
    expect(result.camera.normalizedBrand).toBe("sony");
    expect(result.primaryExtractor).toBe("sony");
    expect(result.selectedExtractor).toBe("generic");
    expect(result.fallbackUsed).toBe(true);
    expect(result.shutterCount).toBe(88);
  });

  it("detects Panasonic and Lumix bodies as Panasonic brand", () => {
    expect(
      detectCameraBrand([
        tag("EXIF:Make", "Panasonic"),
        tag("EXIF:Model", "DC-S5M2"),
      ]).normalizedBrand,
    ).toBe("panasonic");

    expect(
      detectCameraBrand([
        tag("EXIF:Make", "LUMIX"),
        tag("EXIF:Model", "DC-GH6"),
      ]).normalizedBrand,
    ).toBe("panasonic");
  });

  it("does not treat Panasonic sequence counters as shutter count", () => {
    const result = extractShutterCount([
      tag("EXIF:Make", "Panasonic"),
      tag("EXIF:Model", "DC-G9M2"),
      tag("Panasonic:SequenceNumber", 412),
      tag("Panasonic:ShutterType", "Mechanical"),
    ]);

    expect(result.status).toBe("not_found");
    expect(result.camera.normalizedBrand).toBe("panasonic");
    expect(result.primaryExtractor).toBe("panasonic");
    expect(result.selectedExtractor).toBe("generic");
    expect(result.shutterCount).toBeNull();
  });

  it("rejects invalid numeric values", () => {
    const result = extractShutterCount([
      tag("EXIF:Make", "NIKON CORPORATION"),
      tag("EXIF:Model", "Zf"),
      tag("MakerNotes:ShutterCount", "abc"),
    ]);

    expect(result.status).toBe("invalid_value");
    expect(result.shutterCount).toBeNull();
  });

  it("normalizes brand detection from make and model fields", () => {
    expect(
      detectCameraBrand([tag("EXIF:Model", "EOS R5")]).normalizedBrand,
    ).toBe("canon");

    expect(
      detectCameraBrand([tag("EXIF:Make", "FUJIFILM")]).normalizedBrand,
    ).toBe("fujifilm");
  });
});
