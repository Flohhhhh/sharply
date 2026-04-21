import { clsx,type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { buildGearSearchName } from "~/lib/gear/naming";
import { MOUNTS } from "~/lib/generated";
import type { GearItem } from "~/types/gear";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Capitalizes the first letter of a string (safe for empty/undefined inputs). */
export function capitalize(value: string | null | undefined): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizeSearchName(name: string, brandName?: string) {
  return buildGearSearchName({ name, brandName });
}

/**
 * Converts cents to USD dollars
 * @param cents - The amount in cents
 * @returns The amount in dollars, or undefined if cents is null/undefined
 */
export function centsToUsd(
  cents: number | null | undefined,
): number | undefined {
  if (cents === null || cents === undefined) {
    return undefined;
  }
  return cents / 100;
}

/**
 * Converts USD dollars to cents
 * @param dollars - The amount in dollars
 * @returns The amount in cents, or null if dollars is undefined
 */
export function usdToCents(dollars: number | undefined): number | null {
  if (dollars === undefined) {
    return null;
  }
  return Math.round(dollars * 100);
}

/**
 * Converts camelCase/snake_case/kebab-case keys to human-friendly labels.
 * Examples: "msrpUsdCents" -> "Msrp Usd Cents" (then acronym fixes -> "MSRP USD Cents")
 */
export function humanizeKey(key: string): string {
  if (!key) return "";
  // Insert spaces between camelCase boundaries and normalize separators
  let label = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Common acronym and unit fixes
  label = label
    .replace(/\bId\b/g, "ID")
    .replace(/\bIso\b/g, "ISO")
    .replace(/\bFps\b/g, "FPS")
    .replace(/\bMp\b/g, "MP")
    .replace(/\bUsd\b/g, "USD")
    .replace(/\bMsrp\b/g, "MSRP")
    .replace(/\bMm\b/g, "mm");

  // Remove unwanted tokens entirely (case-insensitive)
  const STOP_WORDS = new Set(["id", "ids", "cent", "cents"]);
  label = label
    .split(/\s+/)
    .filter((t) => !STOP_WORDS.has(t.toLowerCase()))
    .join(" ");

  return label;
}

// Under construction state for gear pages
export function getConstructionState(gearItem: GearItem) {
  const missing: string[] = [];

  // Core checks
  if (!gearItem?.brandId) missing.push("Brand");
  // Check both legacy mountId and new multi-mount mountIds array
  const hasMount =
    gearItem?.mountId || (gearItem?.mountIds && gearItem.mountIds.length > 0);
  if (!hasMount) missing.push("Mount");

  if (gearItem.gearType === "LENS") {
    const focalMin = gearItem.lensSpecs?.focalLengthMinMm ?? null;
    const focalMax = gearItem.lensSpecs?.focalLengthMaxMm ?? null;
    if (!focalMin || !focalMax) {
      missing.push("Focal length");
    }
    if (!gearItem.lensSpecs?.isPrime === null) {
      missing.push("Prime/Zoom");
    }
    if (!gearItem.lensSpecs?.maxApertureWide === null) {
      missing.push("Max aperture");
    }
  }

  if (gearItem.gearType === "CAMERA") {
    const sensorFormatId = gearItem.cameraSpecs?.sensorFormatId ?? null;
    const resolution =
      Number(gearItem.cameraSpecs?.resolutionMp ?? null) || null;
    if (!sensorFormatId) missing.push("Sensor type");
    if (!resolution) missing.push("Sensor resolution");

    // Integrated lens cameras: if mount = fixed-lens and focal length is missing, mark under construction
    const primaryMountId = Array.isArray(gearItem.mountIds)
      ? (gearItem.mountIds[0] ?? gearItem.mountId)
      : gearItem.mountId;
    const mountValue = (MOUNTS as any[]).find((m) => m.id === primaryMountId)
      ?.value as string | undefined;
    if (mountValue === "fixed-lens") {
      const fmin = gearItem.fixedLensSpecs?.focalLengthMinMm ?? null;
      const fmax = gearItem.fixedLensSpecs?.focalLengthMaxMm ?? null;
      if (fmin == null && fmax == null) {
        missing.push("Integrated lens focal length");
      }
    }
  }

  if (gearItem.gearType === "ANALOG_CAMERA") {
    const cameraType = gearItem.analogCameraSpecs?.cameraType ?? null;
    const captureMedium = gearItem.analogCameraSpecs?.captureMedium ?? null;
    if (!cameraType) missing.push("Camera type");
    if (!captureMedium) missing.push("Capture medium");
  }

  // Integrated lens check for camera-like gear (digital or analog)
  if (gearItem.gearType === "CAMERA" || gearItem.gearType === "ANALOG_CAMERA") {
    const primaryMountId = Array.isArray(gearItem.mountIds)
      ? (gearItem.mountIds[0] ?? gearItem.mountId)
      : gearItem.mountId;
    const mountValue = (MOUNTS as any[]).find((m) => m.id === primaryMountId)
      ?.value as string | undefined;
    if (mountValue === "fixed-lens") {
      const fmin = gearItem.fixedLensSpecs?.focalLengthMinMm ?? null;
      const fmax = gearItem.fixedLensSpecs?.focalLengthMaxMm ?? null;
      if (fmin == null && fmax == null) {
        missing.push("Integrated lens focal length");
      }
    }
  }

  return {
    underConstruction: missing.length > 0,
    missing,
  };
}

/** Convert a positive integer to Roman numerals (supports large values) */
export function toRomanNumeral(n: number | undefined): string {
  if (!n || n <= 0) return "";
  const map: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let res = "";
  let v = n;
  for (const [val, sym] of map) {
    while (v >= val) {
      res += sym;
      v -= val;
    }
  }
  return res;
}
