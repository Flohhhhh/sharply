import { capitalize } from "../utils";

const SHUTTER_TYPE_LABELS: Record<string, string> = {
  mechanical: "Mechanical",
  efc: "Electronic Front-Curtain",
  electronic: "Electronic",
};

/**
 * Formats shutter type identifiers into human-readable labels.
 * Falls back to capitalizing the provided value when no mapping exists.
 */
export function formatShutterType(
  shutterType: string | null | undefined,
): string {
  if (!shutterType) return "";
  const normalized = shutterType.trim();
  if (!normalized) return "";
  const key = normalized.toLowerCase();
  return SHUTTER_TYPE_LABELS[key] ?? capitalize(normalized);
}
