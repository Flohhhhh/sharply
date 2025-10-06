/**
 * Camera type display formatter
 * Ensures acronyms like DSLR/SLR are fully capitalized, and others are title-cased.
 */

const CAMERA_TYPE_LABELS: Record<string, string> = {
  dslr: "DSLR",
  slr: "SLR",
  mirrorless: "Mirrorless",
  action: "Action",
  cinema: "Cinema",
};

export function formatCameraType(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const key = value.toLowerCase();
  const mapped = CAMERA_TYPE_LABELS[key];
  if (mapped) return mapped;
  // Fallback: simple sentence-case
  return value.charAt(0).toUpperCase() + value.slice(1);
}
