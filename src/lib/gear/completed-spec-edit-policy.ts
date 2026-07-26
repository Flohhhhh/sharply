import { MOUNTS } from "~/lib/generated";
import type { GearItem } from "~/types/gear";

export type ProposalSpecSection =
  | "core"
  | "camera"
  | "analogCamera"
  | "lens"
  | "fixedLens";

export type CompletedSpecLock = {
  section: ProposalSpecSection;
  fields: readonly string[];
};

export const isCompletedSpecValue = (value: unknown) => {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export function hasConstructionNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number > 0;
}

export function hasMountValue(item: GearItem) {
  return isCompletedSpecValue(item.mountId) || isCompletedSpecValue(item.mountIds);
}

export function hasLensFocalLengthGroup(item: GearItem) {
  const lens = item.lensSpecs;
  return (
    hasConstructionNumber(lens?.focalLengthMinMm) &&
    hasConstructionNumber(lens?.focalLengthMaxMm) &&
    lens?.isPrime != null
  );
}

export function hasFixedLensMount(item: GearItem) {
  const mountId = item.mountIds?.[0] ?? item.mountId;
  return (MOUNTS as { id: string; value: string }[]).some(
    (mount) => mount.id === mountId && mount.value === "fixed-lens",
  );
}

export function hasFixedLensFocalLength(item: GearItem) {
  const lens = item.fixedLensSpecs;
  return (
    hasConstructionNumber(lens?.focalLengthMinMm) ||
    hasConstructionNumber(lens?.focalLengthMaxMm)
  );
}

/**
 * Completion-critical specs that regular contributors can fill but not later
 * replace or clear. This policy deliberately remains independent from display
 * registry metadata and construction-page presentation.
 */
export function getCompletedSpecLocks(item: GearItem): CompletedSpecLock[] {
  const locks: CompletedSpecLock[] = [];
  if (isCompletedSpecValue(item.brandId)) {
    locks.push({ section: "core", fields: ["brandId"] });
  }
  const hasMount = hasMountValue(item);
  if (hasMount) {
    locks.push({ section: "core", fields: ["mountId", "mountIds"] });
  }

  if (item.gearType === "LENS") {
    const lens = item.lensSpecs;
    if (hasLensFocalLengthGroup(item)) {
      locks.push({
        section: "lens",
        fields: ["focalLengthMinMm", "focalLengthMaxMm", "isPrime"],
      });
    }
    if (hasConstructionNumber(lens?.maxApertureWide)) {
      locks.push({ section: "lens", fields: ["maxApertureWide"] });
    }
    if (isCompletedSpecValue(lens?.imageCircleSizeId)) {
      locks.push({ section: "lens", fields: ["imageCircleSizeId"] });
    }
  }

  if (item.gearType === "CAMERA") {
    const camera = item.cameraSpecs;
    if (isCompletedSpecValue(camera?.sensorFormatId)) {
      locks.push({ section: "camera", fields: ["sensorFormatId"] });
    }
    if (hasConstructionNumber(camera?.resolutionMp)) {
      locks.push({ section: "camera", fields: ["resolutionMp"] });
    }
  }

  if (item.gearType === "ANALOG_CAMERA") {
    const analog = item.analogCameraSpecs;
    if (isCompletedSpecValue(analog?.cameraType)) {
      locks.push({ section: "analogCamera", fields: ["cameraType"] });
    }
    if (isCompletedSpecValue(analog?.captureMedium)) {
      locks.push({ section: "analogCamera", fields: ["captureMedium"] });
    }
  }

  if (
    (item.gearType === "CAMERA" || item.gearType === "ANALOG_CAMERA") &&
    hasFixedLensMount(item)
  ) {
    if (hasFixedLensFocalLength(item)) {
      locks.push({
        section: "fixedLens",
        fields: ["focalLengthMinMm", "focalLengthMaxMm", "isPrime"],
      });
    }
  }

  return locks;
}

export function isCompletedSpecFieldLocked(
  locks: readonly CompletedSpecLock[],
  section: ProposalSpecSection,
  field: string,
) {
  return locks.some(
    (lock) => lock.section === section && lock.fields.includes(field),
  );
}
