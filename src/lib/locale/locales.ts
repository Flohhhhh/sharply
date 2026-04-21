import {
  resolveRegionFromCountryCode,
  type GearRegion,
} from "~/lib/gear/region";
import type { Locale } from "~/i18n/config";

export type LocaleId = "us" | "uk" | "eu" | "de" | "fr" | "es" | "it" | "jp" | "global";

export type LocaleOption = {
  id: LocaleId;
  label: string;
  /** ISO alpha-2 used for flags and storage */
  countryCode: string | null;
  /** Canonical country code for affiliate fallback */
  affiliateCountryCode: string | null;
  gearRegion: GearRegion;
  affiliate: {
    mpbMarket: "US" | "UK" | "EU" | "DE" | "FR" | "ES" | "IT" | null;
    amazonHost?: string | null;
  };
};

export type LanguageMarketOption = {
  id: string;
  locale: Locale;
  localeId: LocaleId;
  label: string;
  shortLabel: string;
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
    gearRegion: "EU",
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
    id: "de",
    label: "Germany",
    countryCode: "DE",
    affiliateCountryCode: "DE",
    gearRegion: "EU",
    affiliate: { mpbMarket: "DE", amazonHost: "www.amazon.de" },
  },
  {
    id: "fr",
    label: "France",
    countryCode: "FR",
    affiliateCountryCode: "FR",
    gearRegion: "EU",
    affiliate: { mpbMarket: "FR", amazonHost: "www.amazon.fr" },
  },
  {
    id: "es",
    label: "Spain",
    countryCode: "ES",
    affiliateCountryCode: "ES",
    gearRegion: "EU",
    affiliate: { mpbMarket: "ES", amazonHost: "www.amazon.es" },
  },
  {
    id: "it",
    label: "Italy",
    countryCode: "IT",
    affiliateCountryCode: "IT",
    gearRegion: "EU",
    affiliate: { mpbMarket: "IT", amazonHost: "www.amazon.it" },
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

export const LANGUAGE_MARKET_OPTIONS: LanguageMarketOption[] = [
  {
    id: "en-us",
    locale: "en",
    localeId: "us",
    label: "English (United States)",
    shortLabel: "English",
  },
  {
    id: "en-uk",
    locale: "en",
    localeId: "uk",
    label: "English (United Kingdom)",
    shortLabel: "English",
  },
  {
    id: "en-eu",
    locale: "en",
    localeId: "eu",
    label: "English (Europe)",
    shortLabel: "English",
  },
  {
    id: "de-eu",
    locale: "de",
    localeId: "de",
    label: "Deutsch (Deutschland)",
    shortLabel: "Deutsch",
  },
  {
    id: "fr-eu",
    locale: "fr",
    localeId: "fr",
    label: "Francais (France)",
    shortLabel: "Francais",
  },
  {
    id: "es-es",
    locale: "es",
    localeId: "es",
    label: "Espanol (Espana)",
    shortLabel: "Espanol",
  },
  {
    id: "it-it",
    locale: "it",
    localeId: "it",
    label: "Italiano (Italia)",
    shortLabel: "Italiano",
  },
  {
    id: "ja-jp",
    locale: "ja",
    localeId: "jp",
    label: "日本語 (日本)",
    shortLabel: "日本語",
  },
];

const DEFAULT_LANGUAGE_MARKET_BY_LOCALE: Record<Locale, LanguageMarketOption> = {
  en: LANGUAGE_MARKET_OPTIONS[0]!,
  de: LANGUAGE_MARKET_OPTIONS[3]!,
  fr: LANGUAGE_MARKET_OPTIONS[4]!,
  es: LANGUAGE_MARKET_OPTIONS[5]!,
  it: LANGUAGE_MARKET_OPTIONS[6]!,
  ja: LANGUAGE_MARKET_OPTIONS[7]!,
};

const REGION_DEFAULT_LOCALE_ID: Partial<Record<GearRegion, LocaleId>> = {
  EU: "eu",
  JP: "jp",
  GLOBAL: "us",
};

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
      LOCALE_COUNTRY_FALLBACK.GB ??
      LOCALE_OPTIONS.find((opt) => opt.id === "uk");
    if (gbLocale) return gbLocale;
    return DEFAULT_LOCALE;
  }
  if (normalized === "EU") {
    const euLocale =
      LOCALE_COUNTRY_FALLBACK.EU ??
      LOCALE_OPTIONS.find((opt) => opt.id === "eu");
    if (euLocale) return euLocale;
    return DEFAULT_LOCALE;
  }

  // Default: resolve region and pick matching locale
  const region = resolveRegionFromCountryCode(normalized || null);
  const preferredLocaleId = REGION_DEFAULT_LOCALE_ID[region];
  const byRegion = preferredLocaleId
    ? LOCALE_OPTIONS.find((opt) => opt.id === preferredLocaleId)
    : LOCALE_OPTIONS.find((opt) => opt.gearRegion === region);
  return byRegion ?? DEFAULT_LOCALE;
}

export function getDefaultLocale(): LocaleOption {
  return DEFAULT_LOCALE;
}

export function getLanguageMarketOptionById(
  id: string | null | undefined,
): LanguageMarketOption | null {
  if (!id) return null;
  return LANGUAGE_MARKET_OPTIONS.find((option) => option.id === id) ?? null;
}

export function getDefaultLanguageMarketOption(
  locale: Locale,
): LanguageMarketOption {
  return DEFAULT_LANGUAGE_MARKET_BY_LOCALE[locale];
}

export function getLanguageMarketOptionForLocale(
  locale: Locale,
  localeId: LocaleId | null | undefined,
): LanguageMarketOption {
  if (localeId) {
    const exactMatch = LANGUAGE_MARKET_OPTIONS.find(
      (option) => option.locale === locale && option.localeId === localeId,
    );
    if (exactMatch) return exactMatch;
  }

  return getDefaultLanguageMarketOption(locale);
}
