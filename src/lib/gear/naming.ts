import type { GearAlias } from "~/types/gear";
import { resolveRegionFromCountryCode, type GearRegion } from "./region";

type GearNameSource = {
  name: string;
  regionalAliases?: GearAlias[] | null;
};

type GearDisplayNameOptions = {
  region?: GearRegion | null;
  countryCode?: string | null;
};

export function GetGearDisplayName(
  item: GearNameSource,
  options?: GearDisplayNameOptions,
): string {
  const region =
    options?.region ??
    resolveRegionFromCountryCode(options?.countryCode ?? null);
  if (!item.regionalAliases?.length) {
    return item.name;
  }

  const alias = item.regionalAliases.find((entry) => entry.region === region);
  return alias?.name || item.name;
}

export function normalizeGearSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureBrandPrefix(value: string, brandName?: string | null) {
  const normalizedValue = normalizeGearSearchText(value);
  if (!brandName) return normalizedValue;

  const normalizedBrand = normalizeGearSearchText(brandName);
  if (!normalizedBrand) return normalizedValue;

  if (normalizedValue.includes(normalizedBrand)) {
    return normalizedValue;
  }

  return normalizeGearSearchText(`${brandName} ${value}`);
}

export function buildGearSearchName(params: {
  name: string;
  brandName?: string | null;
  aliases?: Array<Pick<GearAlias, "name"> | string> | null;
}): string {
  const { name, brandName, aliases } = params;
  const rawNames = [name, ...(aliases ?? [])]
    .map((entry) => (typeof entry === "string" ? entry : entry.name))
    .map((entry) => entry?.trim())
    .filter((entry): entry is string => Boolean(entry));

  const unique = new Set(
    rawNames.map((entry) => ensureBrandPrefix(entry, brandName)),
  );

  return Array.from(unique).join(" ").trim();
}
