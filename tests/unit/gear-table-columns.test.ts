import { describe, expect, it } from "vitest";
import {
  compareNullable,
  formatMountNames,
  getCameraTypeDisplay,
  getEffectiveDateValue,
  getEffectivePrice,
  getMountDisplayNames,
} from "~/components/table/gear-table-helpers";
import type { GearTableRow } from "~/components/table/gear-table-types";

const row: GearTableRow = {
  id: "gear-1",
  slug: "gear-1",
  name: "Gear One",
  regionalAliases: [],
  brandName: "Brand",
  gearType: "CAMERA",
  mountNames: [],
  releaseDate: null,
  releaseDatePrecision: null,
  announcedDate: "2023-06-01T00:00:00.000Z",
  announceDatePrecision: "MONTH",
  msrpNowUsdCents: 100_000,
  mpbMaxPriceUsdCents: 75_000,
  sensorFormatName: null,
  analogCaptureMedium: null,
  weightGrams: null,
  focalLengthMinMm: null,
  focalLengthMaxMm: null,
  isPrime: null,
  maxApertureWide: null,
  maxApertureTele: null,
};

describe("gear table sort values", () => {
  it("formats canonical mount values with the shared display helper", () => {
    expect(formatMountNames(["ef-m-canon", "m43-panasonic"])).toBe(
      "EF-M - Canon, Micro 4/3 - Panasonic",
    );
  });

  it("uses sensor format for digital cameras and film medium for analog cameras", () => {
    expect(
      getCameraTypeDisplay({ ...row, sensorFormatName: "Full Frame" }),
    ).toBe("Full Frame");
    expect(
      getCameraTypeDisplay({
        ...row,
        gearType: "ANALOG_CAMERA",
        analogCaptureMedium: "35mm",
      }),
    ).toBe("35mm Film");
  });

  it("keeps the display names available for a three-mount table preview", () => {
    const mounts = getMountDisplayNames([
      "fd-canon",
      "ef-canon",
      "ef-m-canon",
      "rf-canon",
    ]);

    expect(mounts.slice(0, 3)).toEqual([
      "FD - Canon",
      "EF - Canon",
      "EF-M - Canon",
    ]);
    expect(mounts.length - 3).toBe(1);
  });

  it("uses announcement as the release fallback and MPB as the price preference", () => {
    expect(getEffectiveDateValue(row)).toBe(
      Date.parse(row.announcedDate as string),
    );
    expect(getEffectivePrice(row)).toBe(75_000);
  });

  it("sorts unknown values last", () => {
    expect(
      compareNullable<number>(null, 10, (left, right) => left - right),
    ).toBe(1);
    expect(
      compareNullable<number>(10, null, (left, right) => left - right),
    ).toBe(-1);
    expect(
      compareNullable<number>(null, null, (left, right) => left - right),
    ).toBe(0);
  });
});
