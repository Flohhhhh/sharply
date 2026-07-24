import type { ConstructionMinimalRow } from "~/server/gear/data";
import { toNullableNumber } from "~/server/gear/number-utils";
import type { GearItem } from "~/types/gear";

type ConstructionRow = ConstructionMinimalRow & { mountIds: string[] };

export function toConstructionGearItem(row: ConstructionRow): GearItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    gearType: row.gearType,
    brandId: row.brandId,
    mountId: row.mountId,
    mountIds: row.mountIds,
    cameraSpecs:
      row.gearType === "CAMERA"
        ? {
            sensorFormatId: row.camera_sensorFormatId,
            resolutionMp: row.camera_resolutionMp,
          }
        : null,
    analogCameraSpecs:
      row.gearType === "ANALOG_CAMERA"
        ? {
            cameraType: row.analog_cameraType,
            captureMedium: row.analog_captureMedium,
          }
        : null,
    lensSpecs:
      row.gearType === "LENS"
        ? {
            isPrime: row.lens_isPrime,
            focalLengthMinMm: row.lens_focalMin,
            focalLengthMaxMm: row.lens_focalMax,
            maxApertureWide: toNullableNumber(row.lens_maxApertureWide),
            imageCircleSizeId: row.lens_imageCircleSizeId,
          }
        : null,
    fixedLensSpecs:
      row.gearType === "CAMERA" || row.gearType === "ANALOG_CAMERA"
        ? {
            focalLengthMinMm: row.fixed_focalMin,
            focalLengthMaxMm: row.fixed_focalMax,
          }
        : null,
  } as GearItem;
}
