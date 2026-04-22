import type { LinkProps } from "next/link";
import type { Locale } from "./config";
import { defaultLocale,isLocale,locales } from "./config";

export const localePrefixHeaderName = "x-sharply-locale-prefix";
export const normalizedPathHeaderName = "x-sharply-normalized-pathname";
export const normalizedSearchHeaderName = "x-sharply-normalized-search";
export const normalizedCallbackUrlHeaderName =
  "x-sharply-normalized-callback-url";

export function stripLocalePrefix(pathname: string): {
  locale: Locale | null;
  pathname: string;
} {
  if (!pathname || pathname === "/") {
    return {
      locale: null,
      pathname: "/",
    };
  }

  const segments = pathname.split("/");
  const candidate = segments[1];

  if (!isLocale(candidate)) {
    return {
      locale: null,
      pathname,
    };
  }

  const rest = segments.slice(2).join("/");

  return {
    locale: candidate,
    pathname: rest ? `/${rest}` : "/",
  };
}

export function getLocalePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

export function buildNormalizedCallbackUrl(
  pathname: string,
  search: string = "",
) {
  return `${pathname}${search}`;
}

export function applyRoutingRequestHeaders(
  headers: Headers,
  options: {
    locale: Locale;
    normalizedPathname: string;
    normalizedSearch?: string;
  },
) {
  const normalizedSearch = options.normalizedSearch ?? "";

  headers.set(localePrefixHeaderName, getLocalePrefix(options.locale));
  headers.set(normalizedPathHeaderName, options.normalizedPathname);
  headers.set(normalizedSearchHeaderName, normalizedSearch);
  headers.set(
    normalizedCallbackUrlHeaderName,
    buildNormalizedCallbackUrl(options.normalizedPathname, normalizedSearch),
  );

  return headers;
}

export function localizePathname(pathname: string, locale: Locale) {
  if (
    !pathname ||
    pathname.startsWith("#") ||
    pathname.startsWith("?") ||
    /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(pathname) ||
    pathname.startsWith("//")
  ) {
    return pathname;
  }

  const { pathname: normalizedPathname } = stripLocalePrefix(pathname);
  const prefix = getLocalePrefix(locale);

  return normalizedPathname === "/"
    ? prefix || "/"
    : `${prefix}${normalizedPathname}`;
}

export function localizeHref(href: LinkProps["href"], locale: Locale) {
  if (typeof href === "string") {
    return localizePathname(href, locale);
  }

  const pathname =
    typeof href.pathname === "string"
      ? localizePathname(href.pathname, locale)
      : href.pathname;

  return {
    ...href,
    pathname,
  };
}

export function getLocalizedUrl(pathname: string, locale: Locale) {
  return `https://www.sharplyphoto.com${localizePathname(pathname, locale)}`;
}

export function getLocaleAlternates(pathname: string) {
  return Object.fromEntries(
    locales.map((locale) => [locale, getLocalizedUrl(pathname, locale)]),
  ) as Record<Locale, string>;
}
