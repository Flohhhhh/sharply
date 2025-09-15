export function formatFocusDistance(
  focusDistanceMm: number | null | undefined,
): string {
  if (focusDistanceMm == null) return "";

  const feet = focusDistanceMm / 304.8;
  const meters = focusDistanceMm / 1000;

  return `${feet.toFixed(2)}ft / ${meters.toFixed(2)}m`;
}
