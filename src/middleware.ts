import { NextResponse,type NextRequest } from "next/server";
import { defaultLocale,isLocale,localeCookieName } from "./i18n/config";
import {
  applyRoutingRequestHeaders,
  localizePathname,
  stripLocalePrefix,
} from "./i18n/routing";

const cookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
};
const internalLocaleRewriteHeader = "x-sharply-internal-locale-rewrite";

function getCookieLocale(request: NextRequest) {
  const value = request.cookies.get(localeCookieName)?.value;
  return isLocale(value) ? value : defaultLocale;
}

function getInternalLocalePath(pathname: string, locale: string) {
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

export default function middleware(request: NextRequest) {
  const cookieLocale = getCookieLocale(request);
  const { pathname } = request.nextUrl;
  const search = request.nextUrl.search;
  const { locale: prefixedLocale, pathname: normalizedPathname } =
    stripLocalePrefix(pathname);
  const isInternalDefaultRewrite =
    request.headers.get(internalLocaleRewriteHeader) === "1";

  if (prefixedLocale === defaultLocale && !isInternalDefaultRewrite) {
    const url = request.nextUrl.clone();
    url.pathname = normalizedPathname;

    const response = NextResponse.redirect(url, 308);
    response.cookies.set(localeCookieName, defaultLocale, cookieOptions);
    return response;
  }

  if (prefixedLocale) {
    const requestHeaders = applyRoutingRequestHeaders(new Headers(request.headers), {
      locale: prefixedLocale,
      normalizedPathname,
      normalizedSearch: search,
    });
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.set(localeCookieName, prefixedLocale, cookieOptions);
    return response;
  }

  if (cookieLocale !== defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = localizePathname(normalizedPathname, cookieLocale);

    const response = NextResponse.redirect(url, 307);
    response.cookies.set(localeCookieName, cookieLocale, cookieOptions);
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = getInternalLocalePath(normalizedPathname, defaultLocale);
  const requestHeaders = applyRoutingRequestHeaders(new Headers(request.headers), {
    locale: defaultLocale,
    normalizedPathname,
    normalizedSearch: search,
  });
  requestHeaders.set(internalLocaleRewriteHeader, "1");

  const response = NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
  response.cookies.set(localeCookieName, defaultLocale, cookieOptions);
  return response;
}

export const config = {
  matcher: ["/((?!_next|cms|api|favicon.ico|.*\\..*).*)"],
};
