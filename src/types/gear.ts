import type {
  gear,
  cameraSpecs,
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
} from "~/server/db/schema";
import type { VideoModeNormalized } from "~/lib/video/mode-schema";

// Base types from schema
export type Gear = typeof gear.$inferSelect;
export type CameraSpecs = typeof cameraSpecs.$inferSelect;
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

// Unified gear item types
export type GearItem = Gear & {
  brands?: Brand | null;
  mounts?: Mount | null;
  mountIds?: string[] | null; // Canonical multi-mount list
  cameraSpecs?: EnrichedCameraSpecs | null;
  lensSpecs?: LensSpecs | null;
  fixedLensSpecs?: FixedLensSpecs | null;
  afAreaModes?: AfAreaMode[] | null;
  cameraCardSlots?: CameraCardSlot[] | null;
  videoModes?: (CameraVideoMode | VideoModeNormalized)[] | null;
};

export type PopularityEventType =
  (typeof popularityEventTypeEnum.enumValues)[number];

export type { AdminGearTableRow } from "~/server/admin/gear/data";
