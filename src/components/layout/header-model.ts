import type { UserRole } from "~/auth";
import type { Locale } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";
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
  developerAccessEnabled?: boolean;
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
  developerPortal: string;
  signIn: string;
  profile: string;
  account: string;
  logOut: string;
  anonymous: string;
};

export type HeaderViewModel = {
  homeHref: string;
  adminHref: string;
  accountHref: string;
  developerHref: string;
  labels: HeaderLabels;
  navItems: HeaderNavItem[];
  footerItems: HeaderFooterItems;
  moreLabel: string;
};

export function buildHeaderRouteState(normalizedPathname: string): {
  initialMode: HeaderMode;
  scrollResponsive: boolean;
} {
  const isHomePage = normalizedPathname === "/";
  const isSearchResultsPage =
    normalizedPathname === "/search" ||
    normalizedPathname.startsWith("/search/");

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
  navItems,
  footerItems,
  labels,
  moreLabel,
}: {
  locale: Locale;
  navItems: HeaderNavItemSource[];
  footerItems: HeaderFooterItemsSource;
  labels: HeaderLabels;
  moreLabel: string;
}): HeaderViewModel {
  return {
    homeHref: localizePathname("/", locale),
    adminHref: localizePathname("/admin", locale),
    accountHref: localizePathname("/profile/settings", locale),
    developerHref: localizePathname("/developer", locale),
    labels,
    navItems: localizeHeaderNavItems(navItems, locale),
    footerItems: localizeHeaderFooterItems(footerItems, locale),
    moreLabel,
  };
}
