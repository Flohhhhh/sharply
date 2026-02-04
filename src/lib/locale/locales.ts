import {
  resolveRegionFromCountryCode,
  type GearRegion,
} from "~/lib/gear/region";

export type LocaleId = "us" | "uk" | "eu" | "jp" | "global";

export type LocaleOption = {
  id: LocaleId;
  label: string;
  /** ISO alpha-2 used for flags and storage */
  countryCode: string | null;
  /** Canonical country code for affiliate fallback */
  affiliateCountryCode: string | null;
  gearRegion: GearRegion;
  affiliate: {
    mpbMarket: "US" | "UK" | "EU" | null;
    amazonHost?: string | null;
  };
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  {
    id: "us",
    label: "United States",
    countryCode: "US",
    affiliateCountryCode: "US",
    gearRegion: "GLOBAL",
    affiliate: { mpbMarket: "US", amazonHost: "www.amazon.com" },
  },
  {
    id: "uk",
    label: "United Kingdom",
    countryCode: "GB",
    affiliateCountryCode: "GB",
    gearRegion: "GLOBAL",
    affiliate: { mpbMarket: "UK", amazonHost: "www.amazon.co.uk" },
  },
  {
    id: "eu",
    label: "Europe",
    countryCode: "EU", // not ISO, used for flag selection
    affiliateCountryCode: "FR", // representative ISO for storage/geo
    gearRegion: "EU",
    affiliate: { mpbMarket: "EU", amazonHost: "www.amazon.de" },
  },
  {
    id: "jp",
    label: "Japan",
    countryCode: "JP",
    affiliateCountryCode: "JP",
    gearRegion: "JP",
    affiliate: { mpbMarket: null, amazonHost: "www.amazon.co.jp" },
  },
  {
    id: "global",
    label: "Global",
    countryCode: null,
    affiliateCountryCode: null,
    gearRegion: "GLOBAL",
    affiliate: { mpbMarket: "US", amazonHost: "www.amazon.com" },
  },
];

const DEFAULT_LOCALE = LOCALE_OPTIONS[0]!;

const LOCALE_BY_ID = new Map(LOCALE_OPTIONS.map((opt) => [opt.id, opt]));

export function getLocaleById(
  id: string | null | undefined,
): LocaleOption | null {
  if (!id) return null;
  const normalized = id.toLowerCase() as LocaleId;
  return LOCALE_BY_ID.get(normalized) ?? null;
}

const LOCALE_COUNTRY_FALLBACK: Record<string, LocaleOption> = {};
for (const option of LOCALE_OPTIONS) {
  if (option.countryCode) {
    LOCALE_COUNTRY_FALLBACK[option.countryCode.toUpperCase()] = option;
  }
  if (option.affiliateCountryCode) {
    LOCALE_COUNTRY_FALLBACK[option.affiliateCountryCode.toUpperCase()] = option;
  }
}

export function resolveLocaleFromCountryCode(
  alpha2: string | null,
): LocaleOption {
  const normalized = alpha2?.trim().slice(0, 2).toUpperCase() ?? "";
  if (normalized) {
    const byCode = LOCALE_COUNTRY_FALLBACK[normalized];
    if (byCode) return byCode;
  }

  if (normalized === "UK") {
    const gbLocale =
      LOCALE_COUNTRY_FALLBACK["GB"] ??
      LOCALE_OPTIONS.find((opt) => opt.id === "uk");
    if (gbLocale) return gbLocale;
    return DEFAULT_LOCALE;
  }
  if (normalized === "EU") {
    const euLocale =
      LOCALE_COUNTRY_FALLBACK["EU"] ??
      LOCALE_OPTIONS.find((opt) => opt.id === "eu");
    if (euLocale) return euLocale;
    return DEFAULT_LOCALE;
  }

  // Default: resolve region and pick matching locale
  const region = resolveRegionFromCountryCode(normalized || null);
  const byRegion = LOCALE_OPTIONS.find((opt) => opt.gearRegion === region);
  return byRegion ?? DEFAULT_LOCALE;
}

export function getDefaultLocale(): LocaleOption {
  return DEFAULT_LOCALE;
}
