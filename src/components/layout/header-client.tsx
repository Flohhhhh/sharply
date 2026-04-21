"use client";

import { useScrollState } from "@/lib/hooks/useScrollState";
import { track } from "@vercel/analytics";
import { LayoutDashboard,LogIn,Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname,useSearchParams } from "next/navigation";
import Logo from "public/logo";
import type { UserRole } from "~/auth";
import { LocaleLink } from "~/components/locale-link";
import { useLocalePathnames } from "~/i18n/client";
import type { NotificationView } from "~/server/notifications/service";
import { GlobalSearchBar } from "../search/global-search-bar";
import { ThemeSwitcher } from "../theme-switcher";
import { Button } from "../ui/button";
import { NavMenuDesktop } from "./nav-menu-desktop";
import { NavMenuMobile } from "./nav-menu-mobile";
import { NavSheetDesktop } from "./nav-sheet-desktop";
import { NotificationsDropdown } from "./notifications/notifications-dropdown";
import { UserMenu } from "./user-menu";

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

export default function HeaderClient({
  user,
  notifications,
}: {
  user: HeaderUser;
  notifications: HeaderNotificationsData;
}) {
  const { hasScrolled } = useScrollState(290);
  const t = useTranslations("common");
  const rawPathname = usePathname();
  const { pathname } = useLocalePathnames();
  const searchParams = useSearchParams();
  const isHomePage = pathname === "/";
  const isSearchResultsPage = pathname?.startsWith("/search") ?? false;
  // Home (usesHeroSearchHeader) shows the hero search, so shouldShowHeaderSearch flips
  // to true after scroll to reveal the compact header search; the search results page
  // (isSearchResultsPage) never shows the header search, so shouldShowHeaderSearch stays
  // false and sheetTopClass keeps the expanded header ("top-24...").
  const usesHeroSearchHeader = isHomePage || isSearchResultsPage;
  // Never show the header search bar on the search results page; on home it appears after scroll.
  const shouldShowHeaderSearch =
    (!isSearchResultsPage && hasScrolled) || !usesHeroSearchHeader;
  const sheetTopClass = shouldShowHeaderSearch
    ? "top-16 h-[calc(100vh-4rem)]"
    : "top-24 h-[calc(100vh-6rem)]";

  const callbackUrl = (() => {
    const qs = searchParams?.toString();
    return qs ? `${rawPathname}?${qs}` : rawPathname || "/";
  })();

  const isAdminOrEditor =
    user?.role === "ADMIN" ||
    user?.role === "SUPERADMIN" ||
    user?.role === "EDITOR";

  const notificationsData = notifications ?? {
    notifications: [],
    archived: [],
    unreadCount: 0,
  };

  const handleHeaderSignInClick = () => {
    void track("auth_signin_press", {
      source: "header",
      callbackUrl,
    });
  };

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-200 ${
        shouldShowHeaderSearch
          ? "bg-background h-16 shadow-sm backdrop-blur-sm"
          : "bg-background h-20"
      }`}
    >
      <div className="mx-auto h-full px-4 sm:px-8">
        <div
          className={`h-full items-center ${
            shouldShowHeaderSearch
              ? "flex justify-between gap-6 sm:gap-12"
              : "grid grid-cols-3"
          }`}
        >
          {/* Left section - Logo */}
          <div className="flex justify-start">
            <div
              className={`font-extrabold transition-all duration-200 ${
                shouldShowHeaderSearch ? "text-lg" : "text-2xl"
              }`}
            >
              {shouldShowHeaderSearch ? (
                <div className="flex items-center gap-0 sm:gap-2">
                  {/* Desktop nav sheet trigger - hidden on mobile when scrolled */}
                  <NavSheetDesktop topClass={sheetTopClass}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-2 hidden h-8 w-8 p-2 md:inline-flex"
                    >
                      <Menu className="size-4" />
                    </Button>
                  </NavSheetDesktop>
                  <LocaleLink href="/" className="hidden sm:block">
                    Sharply
                  </LocaleLink>
                  <LocaleLink href="/" className="sm:hidden">
                    <Logo className="fill-foreground h-4 w-4" />
                  </LocaleLink>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Logo className="fill-foreground h-4 w-4" />
                  <LocaleLink href="/">Sharply</LocaleLink>
                </div>
              )}
            </div>
          </div>

          {/* Middle section - Navigation/Search */}
          <div className="flex w-full max-w-4xl justify-center">
            {shouldShowHeaderSearch ? (
              <div className="w-full">
                <GlobalSearchBar />
              </div>
            ) : (
              <div className="hidden md:flex">
                <NavMenuDesktop />
              </div>
            )}
          </div>

          {/* Right section - Mobile menu and Desktop auth buttons */}
          <div className="flex justify-end">
            {/* Mobile menu button - always visible on mobile */}
            <NavMenuMobile user={user}>
              <Button variant="outline" size="sm" className="md:hidden">
                <Menu className="size-4" />
              </Button>
            </NavMenuMobile>

            {/* Desktop auth buttons - only visible on desktop */}
            <div className="hidden items-center gap-3 md:flex">
              <ThemeSwitcher />
              {user ? (
                <>
                  <NotificationsDropdown data={notificationsData} />
                  {isAdminOrEditor && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      icon={<LayoutDashboard />}
                    >
                      <LocaleLink href="/admin">{t("adminPanel")}</LocaleLink>
                    </Button>
                  )}
                  <UserMenu user={user} />
                </>
              ) : (
                <>
                  <Button size="sm" asChild icon={<LogIn />}>
                    <LocaleLink
                      href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                      onClick={handleHeaderSignInClick}
                    >
                      {t("signIn")}
                    </LocaleLink>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
