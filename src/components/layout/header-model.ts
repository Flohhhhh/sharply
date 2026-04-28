import type { UserRole } from "~/auth";
import type { Locale } from "~/i18n/config";
import {
  localizePathname,
  normalizedPathHeaderName,
  normalizedSearchHeaderName,
} from "~/i18n/routing";
import type { NotificationView } from "~/server/notifications/service";

export type HeaderIconKey =
  | "camera"
  | "search"
  | "chart"
  | "book"
  | "settings"
  | "help"
  | "info"
  | "shield"
  | "file"
  | "users"
  | "star"
  | "trending"
  | "zap"
  | "wreath"
  | "target"
  | "palette"
  | "film"
  | "scale"
  | "pencilRuler"
  | "instagram"
  | "flame"
  | "squareStop";

export type HeaderUser = {
  id: string;
  role: UserRole;
  handle?: string | null;
  memberNumber?: number | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

export type HeaderNotificationsData = {
  notifications: NotificationView[];
  archived: NotificationView[];
  unreadCount: number;
} | null;

export type HeaderMode = "expanded" | "compact";

export type HeaderNavItemSource = {
  title: string;
  url: string;
  items?: {
    title: string;
    url: string;
    description?: string;
    iconKey?: HeaderIconKey;
  }[];
};

export type HeaderNavItem = {
  title: string;
  href: string;
  items?: {
    title: string;
    href: string;
    description?: string;
    iconKey?: HeaderIconKey;
  }[];
};

export type HeaderFooterItemsSource = {
  sections: {
    title: string;
    links: { name: string; href: string }[];
  }[];
  bottomLinks: { name: string; href: string }[];
};

export type HeaderFooterItems = HeaderFooterItemsSource;

export type HeaderLabels = {
  adminPanel: string;
  signIn: string;
  profile: string;
  account: string;
  logOut: string;
  anonymous: string;
};

export type HeaderViewModel = {
  normalizedPathname: string;
  normalizedSearch: string;
  initialMode: HeaderMode;
  scrollResponsive: boolean;
  callbackUrl: string;
  homeHref: string;
  adminHref: string;
  accountHref: string;
  signInHref: string;
  profileHref: string | null;
  isAdminOrEditor: boolean;
  labels: HeaderLabels;
  navItems: HeaderNavItem[];
  footerItems: HeaderFooterItems;
  moreLabel: string;
  user: HeaderUser;
  notifications: HeaderNotificationsData;
};

export function buildHeaderRouteState(normalizedPathname: string): {
  initialMode: HeaderMode;
  scrollResponsive: boolean;
} {
  const isHomePage = normalizedPathname === "/";
  const isSearchResultsPage = normalizedPathname === "/search" || normalizedPathname.startsWith("/search/");

  if (isHomePage) {
    return {
      initialMode: "expanded",
      scrollResponsive: true,
    };
  }

  if (isSearchResultsPage) {
    return {
      initialMode: "expanded",
      scrollResponsive: false,
    };
  }

  return {
    initialMode: "compact",
    scrollResponsive: false,
  };
}

export function buildHeaderCallbackUrl(
  locale: Locale,
  normalizedPathname: string,
  normalizedSearch: string,
) {
  return `${localizePathname(normalizedPathname, locale)}${normalizedSearch}`;
}

export function buildHeaderInitialState(requestHeaders: Headers) {
  const normalizedPathname =
    requestHeaders.get(normalizedPathHeaderName) ?? "/";

  return {
    normalizedPathname,
    routeState: buildHeaderRouteState(normalizedPathname),
  };
}

export function buildHeaderInitialSearch(requestHeaders: Headers) {
  return requestHeaders.get(normalizedSearchHeaderName) ?? "";
}

function localizeHeaderNavItems(
  items: HeaderNavItemSource[],
  locale: Locale,
): HeaderNavItem[] {
  return items.map((item) => ({
    title: item.title,
    href: localizePathname(item.url, locale),
    items: item.items?.map((subItem) => ({
      title: subItem.title,
      href: localizePathname(subItem.url, locale),
      description: subItem.description,
      iconKey: subItem.iconKey,
    })),
  }));
}

function localizeHeaderFooterItems(
  items: HeaderFooterItemsSource,
  locale: Locale,
): HeaderFooterItems {
  return {
    sections: items.sections.map((section) => ({
      title: section.title,
      links: section.links.map((link) => ({
        name: link.name,
        href: localizePathname(link.href, locale),
      })),
    })),
    bottomLinks: items.bottomLinks.map((link) => ({
      name: link.name,
      href: localizePathname(link.href, locale),
    })),
  };
}

export function buildHeaderViewModel({
  locale,
  normalizedPathname,
  normalizedSearch = "",
  navItems,
  footerItems,
  labels,
  moreLabel,
  user,
  notifications,
}: {
  locale: Locale;
  normalizedPathname: string;
  normalizedSearch?: string;
  navItems: HeaderNavItemSource[];
  footerItems: HeaderFooterItemsSource;
  labels: HeaderLabels;
  moreLabel: string;
  user: HeaderUser;
  notifications: HeaderNotificationsData;
}): HeaderViewModel {
  const { initialMode, scrollResponsive } =
    buildHeaderRouteState(normalizedPathname);
  const callbackUrl = buildHeaderCallbackUrl(
    locale,
    normalizedPathname,
    normalizedSearch,
  );
  const signInBaseHref = localizePathname("/auth/signin", locale);
  const signInHref = `${signInBaseHref}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  let profileHref: string | null = null;
  if (user && ((user.handle && user.handle.trim() !== "") || user.memberNumber != null)) {
    const profileSlug = user.handle || `user-${user.memberNumber}`;
    profileHref = localizePathname(`/u/${profileSlug}`, locale);
  }

  return {
    normalizedPathname,
    normalizedSearch,
    initialMode,
    scrollResponsive,
    callbackUrl,
    homeHref: localizePathname("/", locale),
    adminHref: localizePathname("/admin", locale),
    accountHref: localizePathname("/profile/settings", locale),
    signInHref,
    profileHref,
    isAdminOrEditor:
      user?.role === "ADMIN" ||
      user?.role === "SUPERADMIN" ||
      user?.role === "EDITOR",
    labels,
    navItems: localizeHeaderNavItems(navItems, locale),
    footerItems: localizeHeaderFooterItems(footerItems, locale),
    moreLabel,
    user,
    notifications,
  };
}