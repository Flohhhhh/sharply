import { clsx, type ClassValue } from "clsx";
import type { GearItem } from "~/types/gear";
import { twMerge } from "tailwind-merge";
import { MOUNTS } from "~/lib/generated";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeSearchName(name: string, brandName?: string) {
  // If no brand name provided, just normalize the gear name
  if (!brandName) {
    return name.toLowerCase().replace(/\s+/g, " ").trim();
  }

  // Check if the gear name already contains the brand name (case insensitive)
  const nameLower = name.toLowerCase();
  const brandLower = brandName.toLowerCase();

  // If brand name is already in the gear name, don't duplicate it
  if (nameLower.includes(brandLower)) {
    return nameLower.replace(/\s+/g, " ").trim();
  }

  // Otherwise, combine them
  return `${brandLower} ${nameLower}`.replace(/\s+/g, " ").trim();
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

/**
 * Formats a date into "June 25th, 2025" style.
 * Accepts Date, string, or number. Returns empty string for invalid inputs.
 */
export function formatHumanDate(
  input: Date | string | number | null | undefined,
): string {
  if (!input) return "";
  // Normalize: if input is a Date, derive an ISO date string to avoid TZ shifts.
  // If input is an ISO date string (YYYY-MM-DD), use it directly.
  let y = 0,
    m = 0,
    d = 0;
  if (input instanceof Date) {
    const iso = input.toISOString().split("T")[0] || ""; // UTC date component
    const parts = iso.split("-").map((n) => Number(n));
    if (parts.length === 3) {
      y = parts[0]!;
      m = parts[1]!;
      d = parts[2]!;
    } else {
      const date = new Date(input);
      if (Number.isNaN(date.getTime())) return "";
      y = date.getUTCFullYear();
      m = date.getUTCMonth() + 1;
      d = date.getUTCDate();
    }
  } else if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const parts = input.split("-").map((n) => Number(n));
    y = parts[0]!;
    m = parts[1]!;
    d = parts[2]!;
  } else {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return "";
    // Use UTC components to avoid local TZ shifts for midnight UTC dates
    y = date.getUTCFullYear();
    m = date.getUTCMonth() + 1;
    d = date.getUTCDate();
  }

  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  const day = d;
  const year = y;

  const suffix = (() => {
    const j = day % 10;
    const k = day % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  })();

  return `${month} ${day}${suffix}, ${year}`;
}

/**
 * Precision-aware date formatter.
 * precision: 'YEAR' | 'MONTH' | 'DAY'. Defaults to DAY when unspecified.
 */
export function formatHumanDateWithPrecision(
  input: Date | string | number | null | undefined,
  precision: "YEAR" | "MONTH" | "DAY" | null | undefined,
): string {
  if (!input) return "";
  const base = formatHumanDate(input);
  if (!base) return "";

  // Derive components in UTC
  let y = 0,
    m = 0,
    d = 0;
  if (input instanceof Date) {
    const iso = input.toISOString().split("T")[0] || "";
    const parts = iso.split("-").map((n) => Number(n));
    if (parts.length === 3) {
      y = parts[0]!;
      m = parts[1]!;
      d = parts[2]!;
    }
  } else if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const parts = input.split("-").map((n) => Number(n));
    y = parts[0]!;
    m = parts[1]!;
    d = parts[2]!;
  } else {
    const date = new Date(input);
    if (!Number.isNaN(date.getTime())) {
      y = date.getUTCFullYear();
      m = date.getUTCMonth() + 1;
      d = date.getUTCDate();
    }
  }

  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });

  const p = (precision || "DAY").toUpperCase();
  if (p === "YEAR") return String(y || "");
  if (p === "MONTH") return `${month} ${y}`.trim();
  return base;
}

// Under construction state for gear pages
export function getConstructionState(gearItem: GearItem) {
  const missing: string[] = [];

  // Core checks
  if (!gearItem?.brandId) missing.push("Brand");
  if (!gearItem?.mountId) missing.push("Mount");

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
