import { describe,expect,it } from "vitest";
import type { GearItem } from "~/types/gear";
import {
  getShutterCountDisplayValue,
  isDigitalCamera,
} from "~/app/[locale]/(pages)/u/_components/collection/collection-table-modal";

function createGearItem(overrides: Partial<GearItem> = {}): GearItem {
  return {
    id: "gear-1",
    slug: "gear-1",
    name: "Test Camera",
    searchName: "test camera",
    gearType: "CAMERA",
    brandId: "brand-1",
    mountId: null,
    releaseDate: null,
    imageUrl: null,
    thumbnailUrl: null,
    msrpUsd: null,
    widthMm: null,
    heightMm: null,
    depthMm: null,
    weightGrams: null,
    notes: null,
    mpbMaxPriceUsdCents: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    cameraSpecs: {
      gearId: "gear-1",
      sensorFormatId: null,
      resolutionMp: null,
      minIsoPhoto: null,
      maxIsoPhoto: null,
      ibis: null,
      shutterTypes: null,
      evfType: null,
      rearDisplayType: null,
      rearDisplaySizeInch: null,
      rearDisplayResolutionDots: null,
      hasTopDisplay: null,
      hasRearTouchscreen: null,
      viewfinderMagnification: null,
      viewfinderResolutionDots: null,
      hasMicInput: null,
      hasHeadphoneJack: null,
      hasWeatherSealing: null,
      batteryModel: null,
      batteryShotsCipa: null,
      usbCharging: null,
      usbPowerDelivery: null,
      storageMedia: null,
      cardSlots: null,
      maxVideoResolution: null,
      maxVideoFrameRate: null,
      videoModes: null,
      rawVideoInternal: null,
      rawVideoExternal: null,
      logGamma: null,
      anamorphicSupport: null,
      openGate: null,
      subjectDetection: null,
      imageStabilizationModes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GearItem["cameraSpecs"],
    ...overrides,
  };
}

describe("collection table shutter helpers", () => {
  it("treats only digital cameras as eligible for shutter counts", () => {
    expect(isDigitalCamera(createGearItem())).toBe(true);
    expect(
      isDigitalCamera(
        createGearItem({
          gearType: "ANALOG_CAMERA",
          cameraSpecs: null,
        }),
      ),
    ).toBe(false);
    expect(
      isDigitalCamera(
        createGearItem({
          gearType: "LENS",
          cameraSpecs: null,
        }),
      ),
    ).toBe(false);
  });

  it("formats the tracked shutter count for digital cameras", () => {
    expect(
      getShutterCountDisplayValue(
        createGearItem({
          shutterTracking: {
            trackedCameraId: "tracked-1",
            latestPrimaryCountValue: 123456,
            latestCaptureAt: "2026-05-03T11:00:00.000Z",
          },
        }),
      ),
    ).toBe("123,456");
  });

  it("returns null when a digital camera has no tracked reading yet", () => {
    expect(getShutterCountDisplayValue(createGearItem())).toBeNull();
  });

  it("returns null for analog cameras and lenses", () => {
    expect(
      getShutterCountDisplayValue(
        createGearItem({
          gearType: "ANALOG_CAMERA",
          cameraSpecs: null,
          shutterTracking: {
            trackedCameraId: "tracked-1",
            latestPrimaryCountValue: 50,
            latestCaptureAt: null,
          },
        }),
      ),
    ).toBeNull();
    expect(
      getShutterCountDisplayValue(
        createGearItem({
          gearType: "LENS",
          cameraSpecs: null,
        }),
      ),
    ).toBeNull();
  });
});
