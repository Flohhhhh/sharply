import type {
  gear,
  cameraSpecs,
  lensSpecs,
  brands,
  mounts,
  sensorFormats,
  popularityEventTypeEnum,
  gearEdits,
} from "~/server/db/schema";

// Base types from schema
export type Gear = typeof gear.$inferSelect;
export type CameraSpecs = typeof cameraSpecs.$inferSelect;
export type LensSpecs = typeof lensSpecs.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Mount = typeof mounts.$inferSelect;
export type SensorFormat = typeof sensorFormats.$inferSelect;
export type GearEditProposal = typeof gearEdits.$inferSelect;

// Unified gear item types
export type GearItem = Gear & {
  brands?: Brand | null;
  mounts?: Mount | null;
  cameraSpecs?: CameraSpecs | null;
  lensSpecs?: LensSpecs | null;
};

export type PopularityEventType =
  (typeof popularityEventTypeEnum.enumValues)[number];
