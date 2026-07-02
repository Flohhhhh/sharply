import { describe, expect, it } from "vitest";

import { getConstructionState } from "~/lib/utils";
import type { GearItem } from "~/types/gear";

const BASE_LENS: GearItem = {
  id: "lens-1",
  slug: "sigma-24-70mm-f-2-8-dg-dn-art",
  name: "Sigma 24-70mm F2.8 DG DN Art",
  gearType: "LENS",
  brandId: "brand-1",
  mountId: "29cd7cf2-b6af-4818-ab36-590c31aa86df",
  mountIds: ["29cd7cf2-b6af-4818-ab36-590c31aa86df"],
  createdAt: new Date("2026-06-30T00:00:00.000Z"),
  updatedAt: new Date("2026-06-30T00:00:00.000Z"),
  publicationState: "PUBLISHED",
  lensSpecs: {
    gearId: "lens-1",
    isPrime: false,
    focalLengthMinMm: 24,
    focalLengthMaxMm: 70,
    imageCircleSizeId: "8b54b0d6-6d23-4e45-a7cc-f6b879c8a111",
    maxApertureWide: "2.8",
    maxApertureTele: "2.8",
    minApertureWide: "22",
    minApertureTele: "22",
    hasStabilization: null,
    cipaStabilizationRatingStops: null,
    hasStabilizationSwitch: null,
    hasAutofocus: null,
    isMacro: null,
    magnification: null,
    minimumFocusDistanceMm: null,
    hasFocusRing: null,
    focusMotorType: null,
    focusThrowDegrees: null,
    hasAfMfSwitch: null,
    hasFocusLimiter: null,
    hasFocusRecallButton: null,
    numberElements: null,
    numberElementGroups: null,
    hasDiffractiveOptics: null,
    lensZoomType: null,
    numberDiaphragmBlades: null,
    hasRoundedDiaphragmBlades: null,
    hasInternalZoom: null,
    hasInternalFocus: null,
    frontElementRotates: null,
    mountMaterial: null,
    hasWeatherSealing: null,
    hasApertureRing: null,
    numberCustomControlRings: null,
    numberFunctionButtons: null,
    acceptsFilterTypes: null,
    frontFilterThreadSizeMm: null,
    rearFilterThreadSizeMm: null,
    dropInFilterSizeMm: null,
    hasBuiltInTeleconverter: null,
    hasLensHood: null,
    hasTripodCollar: null,
    isTiltShift: null,
    tiltDegrees: null,
    shiftMm: null,
    extra: null,
    createdAt: new Date("2026-06-30T00:00:00.000Z"),
    updatedAt: new Date("2026-06-30T00:00:00.000Z"),
  },
} as GearItem;

describe("getConstructionState", () => {
  it("flags lenses missing image circle coverage as under construction", () => {
    const result = getConstructionState({
      ...BASE_LENS,
      lensSpecs: {
        ...BASE_LENS.lensSpecs!,
        imageCircleSizeId: null,
      },
    });

    expect(result.underConstruction).toBe(true);
    expect(result.missing).toContain("Image Circle Size");
  });

  it("treats prime/zoom and max aperture as required lens specs", () => {
    const result = getConstructionState({
      ...BASE_LENS,
      lensSpecs: {
        ...BASE_LENS.lensSpecs!,
        isPrime: null,
        maxApertureWide: null,
      },
    });

    expect(result.underConstruction).toBe(true);
    expect(result.missing).toContain("Prime/Zoom");
    expect(result.missing).toContain("Max aperture");
  });

  it("does not mark a complete lens under construction", () => {
    const result = getConstructionState(BASE_LENS);

    expect(result).toEqual({
      underConstruction: false,
      missing: [],
    });
  });
});
