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
import { useLocalStorage } from "./useLocalStorage";

type CountryContextValue = {
  country: Country | null;
  countryCode: string | null;
  setCountry: (country: Country | null) => void;
  setCountryCode: (alpha2Code: string | null) => void;
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
  const normalizedInitialAlpha2 = useMemo(
    () => normalizeAlpha2Code(initialCountryAlpha2),
    [initialCountryAlpha2],
  );

  const {
    value: storedCountryAlpha2,
    setValue: setStoredCountryAlpha2,
    clear: clearStoredCountryAlpha2,
  } = useLocalStorage<string | null>(
    "country.alpha2.v1",
    normalizedInitialAlpha2,
  );

  const hasAttemptedNavigatorDetection = useRef(false);

  useEffect(() => {
    if (storedCountryAlpha2 || hasAttemptedNavigatorDetection.current) return;
    if (typeof navigator === "undefined") return;
    const locale =
      navigator.language ??
      (Array.isArray(navigator.languages) ? navigator.languages[0] : "");
    const regionPart = locale?.split("-")[1];
    const normalizedRegion = normalizeAlpha2Code(regionPart);
    if (!normalizedRegion) return;
    hasAttemptedNavigatorDetection.current = true;
    setStoredCountryAlpha2(normalizedRegion);
  }, [storedCountryAlpha2, setStoredCountryAlpha2]);

  const resolvedCountry = useMemo(
    () => findCountry(storedCountryAlpha2),
    [storedCountryAlpha2],
  );

  const value = useMemo<CountryContextValue>(
    () => ({
      country: resolvedCountry,
      countryCode: storedCountryAlpha2,
      setCountry: (country) =>
        setStoredCountryAlpha2(
          country ? normalizeAlpha2Code(country.alpha2) : null,
        ),
      setCountryCode: (alpha2Code) =>
        setStoredCountryAlpha2(normalizeAlpha2Code(alpha2Code)),
      clearCountry: () => clearStoredCountryAlpha2(),
    }),
    [
      resolvedCountry,
      storedCountryAlpha2,
      setStoredCountryAlpha2,
      clearStoredCountryAlpha2,
    ],
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

