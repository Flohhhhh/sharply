import type { Metadata } from "next";
import { defaultLocale,locales } from "~/i18n/config";
import { getLocalizedUrl } from "~/i18n/routing";

export function getCanonicalUrl(pathname: string) {
  return getLocalizedUrl(pathname, defaultLocale);
}

export function getAlternateLanguageUrls(pathname: string) {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, getLocalizedUrl(pathname, locale)]),
    ),
    "x-default": getCanonicalUrl(pathname),
  };
}

export function buildLocalizedMetadata(
  pathname: string,
  metadata: Metadata,
): Metadata {
  const alternates = {
    canonical: getCanonicalUrl(pathname),
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
          ...metadata.openGraph,
          url: metadata.openGraph.url ?? getCanonicalUrl(pathname),
        }
      : undefined,
  };
}
