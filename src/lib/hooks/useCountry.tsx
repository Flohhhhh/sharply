"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { countries } from "country-data-list";

import { type Country } from "~/types/country";
import { type GearRegion } from "~/lib/gear/region";
import {
  getDefaultLocale,
  getLocaleById,
  resolveLocaleFromCountryCode,
  type LocaleId,
  type LocaleOption,
} from "~/lib/locale/locales";
import { useLocalStorage } from "./useLocalStorage";

type CountryContextValue = {
  locale: LocaleOption;
  localeId: LocaleId;
  country: Country | null; // best-effort (null for non-ISO options like EU/Global)
  countryCode: string | null; // best-effort ISO code for affiliates
  region: GearRegion; // gear naming region (alias resolver)
  gearRegion: GearRegion; // alias of region for clarity
  setLocale: (locale: LocaleOption) => void;
  setLocaleId: (localeId: LocaleId) => void;
  setCountry: (country: Country | null) => void; // legacy helper
  setCountryCode: (alpha2Code: string | null) => void; // legacy helper
  clearCountry: () => void;
};

const CountryContext = createContext<CountryContextValue | null>(null);

function normalizeAlpha2Code(
  alpha2Code: string | null | undefined,
): string | null {
  if (!alpha2Code) return null;
  const trimmed = alpha2Code.trim();
  if (trimmed.length < 2) return null;
  const normalized = trimmed.slice(0, 2).toUpperCase();
  const existsInList = countries.all.some(
    (country) => country.alpha2 === normalized,
  );
  return existsInList ? normalized : null;
}

function findCountry(alpha2Code: string | null | undefined): Country | null {
  const normalized = normalizeAlpha2Code(alpha2Code);
  if (!normalized) return null;
  const match = countries.all.find(
    (country) =>
      country.alpha2 === normalized &&
      country.emoji &&
      country.status !== "deleted" &&
      country.ioc !== "PRK",
  );
  return match ?? null;
}

export function CountryProvider({
  children,
  initialCountryAlpha2,
}: {
  children: ReactNode;
  initialCountryAlpha2?: string | null;
}) {
  const initialLocale = useMemo(() => {
    if (initialCountryAlpha2) {
      return resolveLocaleFromCountryCode(initialCountryAlpha2);
    }
    return getDefaultLocale();
  }, [initialCountryAlpha2]);

  const {
    value: storedLocaleId,
    setValue: setStoredLocaleId,
    clear: clearStoredLocaleId,
  } = useLocalStorage<string | null>("country.locale.v2", initialLocale.id);

  const hasAttemptedNavigatorDetection = useRef(false);

  useEffect(() => {
    if (storedLocaleId || hasAttemptedNavigatorDetection.current) return;
    if (typeof navigator === "undefined") return;
    const locale =
      navigator.language ??
      (Array.isArray(navigator.languages) ? navigator.languages[0] : "");
    const regionPart = locale?.split("-")[1];
    const normalizedRegion = normalizeAlpha2Code(regionPart);
    if (!normalizedRegion) return;
    hasAttemptedNavigatorDetection.current = true;
    const detectedLocale = resolveLocaleFromCountryCode(normalizedRegion);
    setStoredLocaleId(detectedLocale.id);
  }, [setStoredLocaleId, storedLocaleId]);

  const locale = useMemo<LocaleOption>(() => {
    const byId = getLocaleById(storedLocaleId);
    if (byId) return byId;
    return resolveLocaleFromCountryCode(initialCountryAlpha2 ?? null);
  }, [initialCountryAlpha2, storedLocaleId]);

  const resolvedCountry = useMemo(
    () => findCountry(locale.affiliateCountryCode ?? locale.countryCode),
    [locale.affiliateCountryCode, locale.countryCode],
  );

  const region = locale.gearRegion;

  const value = useMemo<CountryContextValue>(
    () => ({
      locale,
      localeId: locale.id,
      country: resolvedCountry,
      countryCode: locale.affiliateCountryCode ?? locale.countryCode,
      region,
      gearRegion: region,
      setLocale: (nextLocale) => setStoredLocaleId(nextLocale.id),
      setLocaleId: (nextId) => setStoredLocaleId(nextId),
      setCountry: (country) => {
        const nextLocale = resolveLocaleFromCountryCode(
          country ? normalizeAlpha2Code(country.alpha2) : null,
        );
        setStoredLocaleId(nextLocale.id);
      },
      setCountryCode: (alpha2Code) => {
        const nextLocale = resolveLocaleFromCountryCode(alpha2Code);
        setStoredLocaleId(nextLocale.id);
      },
      clearCountry: () => clearStoredLocaleId(),
    }),
    [region, locale, resolvedCountry, setStoredLocaleId, clearStoredLocaleId],
  );

  return (
    <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
  );
}

export function useCountry(): CountryContextValue {
  const countryContext = useContext(CountryContext);
  if (!countryContext) {
    throw new Error("useCountry must be used within CountryProvider");
  }
  return countryContext;
}
