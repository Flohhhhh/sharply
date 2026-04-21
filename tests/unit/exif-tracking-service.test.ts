import { beforeEach,describe,expect,it,vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { ExifViewerResponse } from "../../src/app/[locale]/(pages)/(tools)/exif-viewer/types";
import {
  buildExifReadingDedupeKey,
  createSignedExifTrackingToken,
  hashExifSerial,
  normalizeExifCaptureAt,
  normalizeExifMake,
  normalizeExifModel,
  normalizeExifSerial,
  selectPrimaryExifCount,
  verifySignedExifTrackingToken,
} from "../../src/server/exif-tracking/service";

function createExtractor(
  overrides: Partial<ExifViewerResponse["extractor"]> = {},
): ExifViewerResponse["extractor"] {
  return {
    selected: "nikon",
    primary: "nikon",
    fallbackUsed: false,
    countType: "total",
    sourceTag: "Nikon:ShutterCount",
    mechanicalSourceTag: "Nikon:MechanicalShutterCount",
    shutterCount: 12345,
    totalShutterCount: 12345,
    mechanicalShutterCount: 9000,
    failureReason: null,
    candidateTagsChecked: [],
    rawValuesInspected: [],
    ...overrides,
  };
}

describe("exif tracking service helpers", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-auth-secret";
  });

  it("normalizes EXIF make values by removing corporate suffixes", () => {
    expect(normalizeExifMake("NIKON CORPORATION")).toBe("nikon");
    expect(normalizeExifMake("Canon Inc.")).toBe("canon");
  });

  it("normalizes EXIF model values without aggressive mutation", () => {
    expect(normalizeExifModel("NIKON_Z6-III")).toBe("nikon z6 iii");
  });

  it("normalizes serials into a compact comparable value", () => {
    expect(normalizeExifSerial(" 1234-AB_CD ")).toBe("1234abcd");
  });

  it("hashes normalized serials deterministically", () => {
    expect(hashExifSerial("1234abcd")).toBe(hashExifSerial("1234abcd"));
  });

  it("normalizes EXIF capture dates into ISO strings", () => {
    expect(normalizeExifCaptureAt("2024:10:02 18:45:12-04:00")).toBe(
      "2024-10-02T22:45:12.000Z",
    );
  });

  it("selects total count before mechanical and generic", () => {
    expect(selectPrimaryExifCount(createExtractor())).toEqual({
      type: "total",
      value: 12345,
    });
    expect(
      selectPrimaryExifCount(
        createExtractor({
          totalShutterCount: null,
          shutterCount: null,
        }),
      ),
    ).toEqual({
      type: "mechanical",
      value: 9000,
    });
    expect(
      selectPrimaryExifCount(
        createExtractor({
          totalShutterCount: null,
          mechanicalShutterCount: null,
        }),
      ),
    ).toEqual({
      type: "generic",
      value: 12345,
    });
  });

  it("builds dedupe keys from tracked camera id and reading identity", () => {
    expect(
      buildExifReadingDedupeKey({
        trackedCameraId: "camera-1",
        primaryCountType: "total",
        primaryCountValue: 12345,
        captureAt: "2024-10-02T22:45:12.000Z",
      }),
    ).toBe(
      buildExifReadingDedupeKey({
        trackedCameraId: "camera-1",
        primaryCountType: "total",
        primaryCountValue: 12345,
        captureAt: "2024-10-02T22:45:12.000Z",
      }),
    );
  });

  it("signs and verifies EXIF tracking tokens", async () => {
    const token = await createSignedExifTrackingToken({
      version: 1,
      serialHash: "serial-hash",
      normalizedBrand: "nikon",
      makeRaw: "NIKON CORPORATION",
      modelRaw: "Zf",
      matchedGearId: "gear-1",
      captureAt: "2024-10-02T22:45:12.000Z",
      primaryCountType: "total",
      primaryCountValue: 12345,
      shutterCount: 12345,
      totalShutterCount: 12345,
      mechanicalShutterCount: 9000,
      sourceTag: "Nikon:ShutterCount",
      mechanicalSourceTag: "Nikon:MechanicalShutterCount",
    });

    const payload = await verifySignedExifTrackingToken(token);

    expect(payload.serialHash).toBe("serial-hash");
    expect(payload.primaryCountValue).toBe(12345);
    expect(payload.matchedGearId).toBe("gear-1");
  });
});
