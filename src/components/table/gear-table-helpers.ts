import type { GearTableRow } from "./gear-table-types";
import { formatAnalogMedium } from "~/lib/mapping/analog-types-map";
import { getMountLongName } from "~/lib/mapping/mounts-map";

export function getMountDisplayNames(mountNames: string[]) {
  return mountNames.map(getMountLongName);
}

export function formatMountNames(mountNames: string[]) {
  return getMountDisplayNames(mountNames).join(", ");
}

export function getCameraTypeDisplay(row: GearTableRow) {
  return row.gearType === "ANALOG_CAMERA"
    ? (formatAnalogMedium(row.analogCaptureMedium) ?? null)
    : row.sensorFormatName;
}

export function compareNullable<T>(
  left: T | null | undefined,
  right: T | null | undefined,
  compare: (a: T, b: T) => number,
) {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return compare(left, right);
}

export function getEffectiveDateValue(row: GearTableRow) {
  const raw = row.releaseDate ?? row.announcedDate;
  if (!raw) return null;
  const timestamp = new Date(raw).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getEffectivePrice(row: GearTableRow) {
  return row.mpbMaxPriceUsdCents ?? row.msrpNowUsdCents;
}
