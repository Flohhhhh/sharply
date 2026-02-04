import type {
  gear,
  cameraSpecs,
  analogCameraSpecs,
  lensSpecs,
  fixedLensSpecs,
  brands,
  mounts,
  sensorFormats,
  popularityEventTypeEnum,
  gearEdits,
  afAreaModes,
  cameraCardSlots,
  cameraVideoModes,
  rawSamples,
  gearRawSamples,
  gearAliases,
  gearRegionEnum,
} from "~/server/db/schema";
import type { VideoModeNormalized } from "~/lib/video/mode-schema";
import { ENUMS } from "~/lib/constants";

// Base types from schema
export type Gear = typeof gear.$inferSelect;
export type CameraSpecs = typeof cameraSpecs.$inferSelect;
export type AnalogCameraSpecs = typeof analogCameraSpecs.$inferSelect;
export type LensSpecs = typeof lensSpecs.$inferSelect;
export type FixedLensSpecs = typeof fixedLensSpecs.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Mount = typeof mounts.$inferSelect;
export type SensorFormat = typeof sensorFormats.$inferSelect;
export type GearEditProposal = typeof gearEdits.$inferSelect;
export type AfAreaMode = typeof afAreaModes.$inferSelect;

export type EnrichedCameraSpecs = CameraSpecs & {
  afAreaModes?: AfAreaMode[] | null;
};

export type CameraCardSlot = typeof cameraCardSlots.$inferSelect;
export type CameraVideoMode = typeof cameraVideoModes.$inferSelect;
export type RawSample = typeof rawSamples.$inferSelect;
export type GearRawSample = typeof gearRawSamples.$inferSelect;
export type GearAlias = typeof gearAliases.$inferSelect;
export type GearRegion = (typeof gearRegionEnum.enumValues)[number];

// Unified gear item types
export type GearItem = Gear & {
  brands?: Brand | null;
  mounts?: Mount | null;
  mountIds?: string[] | null; // Canonical multi-mount list
  regionalAliases?: GearAlias[] | null;
  cameraSpecs?: EnrichedCameraSpecs | null;
  analogCameraSpecs?: AnalogCameraSpecs | null;
  lensSpecs?: LensSpecs | null;
  fixedLensSpecs?: FixedLensSpecs | null;
  afAreaModes?: AfAreaMode[] | null;
  cameraCardSlots?: CameraCardSlot[] | null;
  videoModes?: (CameraVideoMode | VideoModeNormalized)[] | null;
  rawSamples?: RawSample[] | null;
};

export type PopularityEventType =
  (typeof popularityEventTypeEnum.enumValues)[number];

export type { AdminGearTableRow } from "~/server/admin/gear/data";

export type GearType = (typeof ENUMS.gear_type)[number];
