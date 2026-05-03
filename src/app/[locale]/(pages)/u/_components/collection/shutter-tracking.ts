import type { GearItem } from "~/types/gear";

export function isDigitalCamera(item: GearItem) {
  return item.gearType === "CAMERA" && Boolean(item.cameraSpecs);
}

export function getShutterCountDisplayValue(item: GearItem) {
  if (!isDigitalCamera(item)) {
    return null;
  }

  const latestPrimaryCountValue = item.shutterTracking?.latestPrimaryCountValue;
  if (latestPrimaryCountValue == null) {
    return null;
  }

  return latestPrimaryCountValue.toLocaleString();
}
