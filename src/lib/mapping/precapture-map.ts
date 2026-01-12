export const PRECAPTURE_SUPPORT_OPTIONS = [
  { value: 0, label: "No" },
  { value: 1, label: "Yes (RAW)" },
  { value: 2, label: "Yes (JPEG only)" },
] as const;

export type PrecaptureSupportLevel =
  (typeof PRECAPTURE_SUPPORT_OPTIONS)[number]["value"];

function toIntOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }
  return null;
}

export function formatPrecaptureSupport(value: unknown): string | undefined {
  const numeric = toIntOrNull(value);
  // Return undefined if no value or explicitly "No" support (0)
  if (numeric === null || numeric === 0) return undefined;
  return PRECAPTURE_SUPPORT_OPTIONS.find((option) => option.value === numeric)
    ?.label;
}
