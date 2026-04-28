"use client";

import { useScrollState } from "@/lib/hooks/useScrollState";
import { track } from "@vercel/analytics";
import { LayoutDashboard, LogIn, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Logo from "public/logo";
import type {
  HeaderNotificationsData,
  HeaderUser,
  HeaderViewModel,
} from "~/components/layout/header-model";
import {
  buildHeaderCallbackUrl,
  buildHeaderRouteState,
} from "~/components/layout/header-model";
import type { Locale } from "~/i18n/config";
import { localizePathname, stripLocalePrefix } from "~/i18n/routing";
import { useSession } from "~/lib/auth/auth-client";
import { GlobalSearchBar } from "../search/global-search-bar";
import { ThemeSwitcher } from "../theme-switcher";
import { Button } from "../ui/button";
import { NavMenuDesktop } from "./nav-menu-desktop";
import { NavMenuMobile } from "./nav-menu-mobile";
import { NavSheetDesktop } from "./nav-sheet-desktop";
import { NotificationsDropdown } from "./notifications/notifications-dropdown";
import { UserMenu } from "./user-menu";

const EMPTY_NOTIFICATIONS = {
  notifications: [],
  archived: [],
  unreadCount: 0,
};

function HeaderSearchParamsSync({
  onNormalizedSearchChange,
}: {
  onNormalizedSearchChange: (value: string) => void;
}) {
  const searchParams = useSearchParams();
  const normalizedSearch = searchParams.toString() ? `?${searchParams.toString()}` : "";

  useEffect(() => {
    onNormalizedSearchChange(normalizedSearch);
  }, [normalizedSearch, onNormalizedSearchChange]);

  return null;
}

export default function HeaderClient({
  model,
  locale,
}: {
  model: HeaderViewModel;
  locale: Locale;
}) {
  const rawPathname = usePathname();
  const normalizedPathname = rawPathname
    ? stripLocalePrefix(rawPathname).pathname
    : model.normalizedPathname;
  const routeState = rawPathname
    ? buildHeaderRouteState(normalizedPathname)
    : {
        initialMode: model.initialMode,
        scrollResponsive: model.scrollResponsive,
      };
  const [normalizedSearch, setNormalizedSearch] = useState(model.normalizedSearch);
  const callbackUrl = buildHeaderCallbackUrl(
    locale,
    normalizedPathname,
    normalizedSearch,
  );
  const signInBaseHref = localizePathname("/auth/signin", locale);
  const signInHref = `${signInBaseHref}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  // Client-side auth state — avoids headers() call on the server during ISR.
  const { data: session, isPending: isSessionPending } = useSession();
  const user: HeaderUser = session?.user
    ? {
        id: session.user.id,
        role: session.user.role,
        handle: session.user.handle ?? null,
        memberNumber: session.user.memberNumber ?? null,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }
    : null;

  const isAdminOrEditor =
    user?.role === "ADMIN" || user?.role === "SUPERADMIN" || user?.role === "EDITOR";

  const profileHref = (() => {
    if (!user) return null;
    const profileSlug =
      user.handle && user.handle.trim() !== ""
        ? user.handle
        : user.memberNumber != null
          ? `user-${user.memberNumber}`
          : null;
    return profileSlug ? localizePathname(`/u/${profileSlug}`, locale) : null;
  })();

  // Client-side notifications — fetched once user is known.
  const [notifications, setNotifications] = useState<HeaderNotificationsData>(
    model.notifications,
  );
  useEffect(() => {
    if (isSessionPending) {
      return;
    }
    if (!user) {
      setNotifications(null);
      return;
    }
    fetch("/api/notifications/header")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setNotifications(data))
      .catch(() => setNotifications(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionPending, user?.id]); // re-fetch only when user identity changes

  const { hasScrolled } = useScrollState(routeState.scrollResponsive ? 290 : Infinity);
  const shouldShowHeaderSearch =
    routeState.initialMode === "compact" || (routeState.scrollResponsive && hasScrolled);
  const sheetTopClass = shouldShowHeaderSearch
    ? "top-16 h-[calc(100vh-4rem)]"
    : "top-24 h-[calc(100vh-6rem)]";
  const notificationsData = notifications ?? EMPTY_NOTIFICATIONS;

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
      <Suspense fallback={null}>
        <HeaderSearchParamsSync
          onNormalizedSearchChange={setNormalizedSearch}
        />
      </Suspense>
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
              callbackUrl={callbackUrl}
              signInHref={signInHref}
              profileHref={profileHref}
              accountHref={model.accountHref}
              user={user}
            >
              <Button variant="outline" size="sm" className="md:hidden">
                <Menu className="size-4" />
              </Button>
            </NavMenuMobile>

            <div className="hidden min-w-[8.5rem] items-center justify-end gap-3 md:flex">
              <ThemeSwitcher />
              {isSessionPending ? (
                <div
                  aria-hidden="true"
                  className="bg-muted h-9 w-24 rounded-md"
                />
              ) : user ? (
                <>
                  <NotificationsDropdown data={notificationsData} />
                  {isAdminOrEditor && (
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
                    user={user}
                    labels={model.labels}
                    profileHref={profileHref}
                    accountHref={model.accountHref}
                  />
                </>
              ) : (
                <Button size="sm" asChild icon={<LogIn />}>
                  <Link href={signInHref} onClick={handleHeaderSignInClick}>
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
