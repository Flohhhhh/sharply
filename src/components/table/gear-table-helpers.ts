import type { GearTableRow } from "./gear-table-types";

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
