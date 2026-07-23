import { describe, expect, it } from "vitest";
import {
  compareNullable,
  getEffectiveDateValue,
  getEffectivePrice,
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
  megapixels: null,
  weightGrams: null,
  focalLengthMinMm: null,
  focalLengthMaxMm: null,
  isPrime: null,
  maxApertureWide: null,
  maxApertureTele: null,
};

describe("gear table sort values", () => {
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
