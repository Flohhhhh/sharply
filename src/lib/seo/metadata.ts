import type { Metadata } from "next";
import type { Locale } from "~/i18n/config";
import { defaultLocale, isLocale, locales } from "~/i18n/config";
import { getLocalizedUrl } from "~/i18n/routing";

/** Open Graph locale identifiers (language_TERRITORY) per supported locale. */
const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  ja: "ja_JP",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  it: "it_IT",
  zh: "zh_CN",
  ms: "ms_MY",
};

export function getCanonicalUrl(
  pathname: string,
  locale: Locale = defaultLocale,
) {
  return getLocalizedUrl(pathname, locale);
}

export function getAlternateLanguageUrls(pathname: string) {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, getLocalizedUrl(pathname, locale)]),
    ),
    "x-default": getLocalizedUrl(pathname, defaultLocale),
  };
}

/**
 * Canonicals are self-referential per locale (with hreflang alternates linking
 * the cluster and x-default on the default locale). A cross-locale canonical
 * would tell search engines to drop the translated pages from their indexes.
 */
export function buildLocalizedMetadata(
  pathname: string,
  metadata: Metadata,
  locale: string = defaultLocale,
): Metadata {
  const resolvedLocale: Locale = isLocale(locale) ? locale : defaultLocale;
  const alternates = {
    canonical: getCanonicalUrl(pathname, resolvedLocale),
    languages: getAlternateLanguageUrls(pathname),
  };

  return {
    ...metadata,
    alternates: {
      ...alternates,
      ...metadata.alternates,
      languages: {
        ...alternates.languages,
        ...(metadata.alternates?.languages ?? {}),
      },
    },
    openGraph: metadata.openGraph
      ? {
          locale: OG_LOCALES[resolvedLocale],
          ...metadata.openGraph,
          url:
            metadata.openGraph.url ?? getCanonicalUrl(pathname, resolvedLocale),
        }
      : undefined,
  };
}
