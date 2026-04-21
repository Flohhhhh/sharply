export const locales = ["en", "ja", "de", "fr", "es", "it", "ms"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeCookieName = "NEXT_LOCALE";

export const localeLabels: Record<
  Locale,
  { shortLabel: string; label: string }
> = {
  en: {
    shortLabel: "EN",
    label: "English",
  },
  ja: {
    shortLabel: "JA",
    label: "Japanese",
  },
  de: {
    shortLabel: "DE",
    label: "German",
  },
  fr: {
    shortLabel: "FR",
    label: "French",
  },
  es: {
    shortLabel: "ES",
    label: "Spanish",
  },
  it: {
    shortLabel: "IT",
    label: "Italian",
  },
  ms: {
    shortLabel: "MS",
    label: "Bahasa Melayu (Malaysia)",
  },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale);
}
