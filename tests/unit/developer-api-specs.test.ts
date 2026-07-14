import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/server/developer-api/service", () => ({
  getDeveloperGear: vi.fn(),
}));

import {
  getDeveloperApiSpecCatalog,
  getDeveloperApiSpecFields,
  getDeveloperApiSpecValue,
} from "~/lib/specs/registry";
import { DeveloperApiError } from "~/server/developer-api/errors";
import { resolveDeveloperApiSpecSelectors } from "~/server/developer-api/specs";
import type { GearItem } from "~/types/gear";

function createGearItem(overrides: Partial<GearItem>): GearItem {
  return {
    id: "gear-1",
    slug: "gear-1",
    name: "Gear 1",
    brandId: null,
    gearType: "CAMERA",
    mountId: null,
    announcedDate: null,
    announceDatePrecision: null,
    releaseDate: null,
    releaseDatePrecision: null,
    ...overrides,
  } as GearItem;
}

describe("developer API spec registry", () => {
  it("uses custom API categories without exposing hidden website fields", () => {
    const catalog = getDeveloperApiSpecCatalog();
    const sensor = catalog.find((category) => category.id === "camera.sensor");

    expect(sensor?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "camera.sensor.isoRange" }),
      ]),
    );
    expect(
      catalog.find((category) => category.id === "camera.shutter")?.fields,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "camera.shutter.availableShutterTypes",
        }),
      ]),
    );
    expect(
      catalog.find((category) => category.id === "camera.fixed-lens")?.fields,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "camera.fixed-lens.focalLength" }),
      ]),
    );
    expect(
      catalog.some((category) => category.id === "camera-sensor-shutter"),
    ).toBe(false);
    expect(catalog.flatMap((category) => category.fields)).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "fixed-lens.fixedImageCircleSize" }),
        expect.objectContaining({ id: "camera.video.videoSummary" }),
        expect.objectContaining({
          id: "camera.video.videoAvailableCodecs",
        }),
      ]),
    );
  });

  it("expands categories in registry order and deduplicates mixed selectors", () => {
    const selected = resolveDeveloperApiSpecSelectors([
      "camera.sensor.isoRange",
      "camera.sensor",
    ]);

    expect(selected[0]?.field.api.id).toBe("camera.sensor.isoRange");
    expect(new Set(selected.map((field) => field.field.api.id)).size).toBe(
      selected.length,
    );
    expect(selected.map((field) => field.field.api.id)).not.toContain(
      "camera.shutter.availableShutterTypes",
    );

    expect(
      resolveDeveloperApiSpecSelectors(["camera.shutter"]).map(
        (field) => field.field.api.id,
      ),
    ).toContain("camera.shutter.availableShutterTypes");
  });

  it("keeps grouped raw values structured while using the existing display by default", () => {
    const field = getDeveloperApiSpecFields().find(
      (definition) => definition.field.api.id === "camera.sensor.isoRange",
    );
    const value = getDeveloperApiSpecValue(
      createGearItem({
        cameraSpecs: { isoMin: 100, isoMax: 51200 } as GearItem["cameraSpecs"],
      }),
      field!,
    );

    expect(value).toEqual({
      id: "camera.sensor.isoRange",
      raw: { min: 100, max: 51200 },
      display: "ISO 100 - 51200",
    });
  });

  it("limits sensor type raw data to its source components", () => {
    const field = getDeveloperApiSpecFields().find(
      (definition) => definition.field.api.id === "camera.sensor.sensorType",
    );
    const value = getDeveloperApiSpecValue(
      createGearItem({
        cameraSpecs: {
          gearId: "internal-gear-id",
          sensorStackingType: "fully-stacked",
          sensorTechType: "cmos",
          isBackSideIlluminated: true,
        } as GearItem["cameraSpecs"],
      }),
      field!,
    );

    expect(value).toEqual({
      id: "camera.sensor.sensorType",
      raw: {
        sensorStackingType: "fully-stacked",
        sensorTechType: "cmos",
        isBackSideIlluminated: true,
      },
      display: "Stacked BSI-CMOS",
    });
  });

  it("rejects selectors that are not in the live catalog", () => {
    expect(() => resolveDeveloperApiSpecSelectors(["camera.unknown"])).toThrow(
      DeveloperApiError,
    );
    expect(() =>
      resolveDeveloperApiSpecSelectors(["camera.video.videoSummary"]),
    ).toThrow(DeveloperApiError);
  });
});
