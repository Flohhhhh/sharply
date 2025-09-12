import type {
  gear,
  cameraSpecs,
  lensSpecs,
  brands,
  mounts,
  sensorFormats,
  popularityEventTypeEnum,
  gearEdits,
  afAreaModes,
  cameraCardSlots,
} from "~/server/db/schema";

// Base types from schema
export type Gear = typeof gear.$inferSelect;
export type CameraSpecs = typeof cameraSpecs.$inferSelect;
export type LensSpecs = typeof lensSpecs.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Mount = typeof mounts.$inferSelect;
export type SensorFormat = typeof sensorFormats.$inferSelect;
export type GearEditProposal = typeof gearEdits.$inferSelect;
export type AfAreaMode = typeof afAreaModes.$inferSelect;

export type EnrichedCameraSpecs = CameraSpecs & {
  afAreaModes?: AfAreaMode[] | null;
};

export type CameraCardSlot = typeof cameraCardSlots.$inferSelect;

// Unified gear item types
export type GearItem = Gear & {
  brands?: Brand | null;
  mounts?: Mount | null;
  cameraSpecs?: EnrichedCameraSpecs | null;
  lensSpecs?: LensSpecs | null;
  afAreaModes?: AfAreaMode[] | null;
  cameraCardSlots?: CameraCardSlot[] | null;
};

export type PopularityEventType =
  (typeof popularityEventTypeEnum.enumValues)[number];
