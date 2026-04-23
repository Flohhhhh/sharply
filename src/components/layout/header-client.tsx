"use client";

import { useScrollState } from "@/lib/hooks/useScrollState";
import { track } from "@vercel/analytics";
import { LayoutDashboard,LogIn,Menu } from "lucide-react";
import Link from "next/link";
import Logo from "public/logo";
import type { HeaderViewModel } from "~/components/layout/header-model";
import { GlobalSearchBar } from "../search/global-search-bar";
import { ThemeSwitcher } from "../theme-switcher";
import { Button } from "../ui/button";
import { NavMenuDesktop } from "./nav-menu-desktop";
import { NavMenuMobile } from "./nav-menu-mobile";
import { NavSheetDesktop } from "./nav-sheet-desktop";
import { NotificationsDropdown } from "./notifications/notifications-dropdown";
import { UserMenu } from "./user-menu";

export default function HeaderClient({ model }: { model: HeaderViewModel }) {
  const { hasScrolled } = useScrollState(model.scrollResponsive ? 290 : Infinity);
  const shouldShowHeaderSearch =
    model.initialMode === "compact" || (model.scrollResponsive && hasScrolled);
  const sheetTopClass = shouldShowHeaderSearch
    ? "top-16 h-[calc(100vh-4rem)]"
    : "top-24 h-[calc(100vh-6rem)]";
  const notificationsData = model.notifications ?? {
    notifications: [],
    archived: [],
    unreadCount: 0,
  };

  const handleHeaderSignInClick = () => {
    void track("auth_signin_press", {
      source: "header",
      callbackUrl: model.callbackUrl,
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
          <div className="flex justify-start">
            <div
              className={`font-extrabold transition-all duration-200 ${
                shouldShowHeaderSearch ? "text-lg" : "text-2xl"
              }`}
            >
              {shouldShowHeaderSearch ? (
                <div className="flex items-center gap-0 sm:gap-2">
                  <NavSheetDesktop
                    topClass={sheetTopClass}
                    footerItems={model.footerItems}
                    moreLabel={model.moreLabel}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-2 hidden h-8 w-8 p-2 md:inline-flex"
                    >
                      <Menu className="size-4" />
                    </Button>
                  </NavSheetDesktop>
                  <Link href={model.homeHref} className="hidden sm:block">
                    Sharply
                  </Link>
                  <Link href={model.homeHref} className="sm:hidden">
                    <Logo className="fill-foreground h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Logo className="fill-foreground h-4 w-4" />
                  <Link href={model.homeHref}>Sharply</Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full max-w-4xl justify-center">
            {shouldShowHeaderSearch ? (
              <div className="w-full">
                <GlobalSearchBar />
              </div>
            ) : (
              <div className="hidden md:flex">
                <NavMenuDesktop items={model.navItems} />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <NavMenuMobile
              items={model.navItems}
              labels={model.labels}
              callbackUrl={model.callbackUrl}
              signInHref={model.signInHref}
              profileHref={model.profileHref}
              accountHref={model.accountHref}
              user={model.user}
            >
              <Button variant="outline" size="sm" className="md:hidden">
                <Menu className="size-4" />
              </Button>
            </NavMenuMobile>

            <div className="hidden items-center gap-3 md:flex">
              <ThemeSwitcher />
              {model.user ? (
                <>
                  <NotificationsDropdown data={notificationsData} />
                  {model.isAdminOrEditor && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      icon={<LayoutDashboard />}
                    >
                      <Link href={model.adminHref}>
                        {model.labels.adminPanel}
                      </Link>
                    </Button>
                  )}
                  <UserMenu
                    user={model.user}
                    labels={model.labels}
                    profileHref={model.profileHref}
                    accountHref={model.accountHref}
                  />
                </>
              ) : (
                <Button size="sm" asChild icon={<LogIn />}>
                  <Link href={model.signInHref} onClick={handleHeaderSignInClick}>
                    {model.labels.signIn}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
