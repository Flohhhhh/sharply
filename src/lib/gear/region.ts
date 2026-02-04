export const GEAR_REGIONS = ["GLOBAL", "EU", "JP"] as const;

export type GearRegion = (typeof GEAR_REGIONS)[number];

const EU_COUNTRY_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

const JP_COUNTRY_CODE = "JP";

export function resolveRegionFromCountryCode(
  countryCode?: string | null,
): GearRegion {
  if (!countryCode) return "GLOBAL";
  const normalized = countryCode.trim().slice(0, 2).toUpperCase();
  if (normalized === "UK") return "GLOBAL";
  if (normalized === "EU") return "EU";
  if (normalized === JP_COUNTRY_CODE) return "JP";
  if (EU_COUNTRY_CODES.has(normalized)) return "EU";
  return "GLOBAL";
}
