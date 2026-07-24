import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { toConstructionGearItem } from "~/server/gear/construction-service";
import type { ConstructionMinimalRow } from "~/server/gear/data";

function makeConstructionRow(
  overrides: Partial<ConstructionMinimalRow & { mountIds: string[] }> = {},
): ConstructionMinimalRow & { mountIds: string[] } {
  return {
    id: "gear-1",
    slug: "sigma-24-70mm-f-2-8-dg-dn-art",
    name: "Sigma 24-70mm F2.8 DG DN Art",
    gearType: "LENS",
    publicationState: "PUBLISHED",
    thumbnailUrl: null,
    brandId: "brand-1",
    brandName: "Sigma",
    mountId: "mount-1",
    mountIds: ["mount-1"],
    createdAt: new Date("2026-07-24T00:00:00.000Z"),
    camera_sensorFormatId: null,
    camera_resolutionMp: null,
    analog_cameraType: null,
    analog_captureMedium: null,
    fixed_focalMin: null,
    fixed_focalMax: null,
    lens_focalMin: 24,
    lens_focalMax: 70,
    lens_isPrime: false,
    lens_maxApertureWide: "2.8",
    lens_imageCircleSizeId: "image-circle-1",
    cameraAll: null,
    analogAll: null,
    lensAll: null,
    fixedAll: null,
    ...overrides,
  };
}

describe("toConstructionGearItem", () => {
  it("normalizes decimal lens apertures to numbers", () => {
    const item = toConstructionGearItem(makeConstructionRow());

    expect(item.lensSpecs?.maxApertureWide).toBe(2.8);
  });

  it("preserves null lens apertures", () => {
    const item = toConstructionGearItem(
      makeConstructionRow({ lens_maxApertureWide: null }),
    );

    expect(item.lensSpecs?.maxApertureWide).toBeNull();
  });
});
