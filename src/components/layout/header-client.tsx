"use client";

import { useScrollState } from "@/lib/hooks/useScrollState";
import { Button } from "../ui/button";
import { LayoutDashboard, LogIn, Menu } from "lucide-react";
import { GlobalSearchBar } from "../search/global-search-bar";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { NavMenuDesktop } from "./nav-menu-desktop";
import { NavMenuMobile } from "./nav-menu-mobile";
import { NavSheetDesktop } from "./nav-sheet-desktop";
import Logo from "public/logo";
import { UserMenu } from "./user-menu";
import { ThemeSwitcher } from "../theme-switcher";
import type { UserRole } from "~/server/auth";

export type HeaderUser = {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

export default function HeaderClient({ user }: { user: HeaderUser }) {
  const { hasScrolled } = useScrollState(290);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHomePage = pathname === "/";
  const sheetTopClass =
    hasScrolled || !isHomePage
      ? "top-16 h-[calc(100vh-4rem)]"
      : "top-24 h-[calc(100vh-6rem)]";

  const callbackUrl = (() => {
    const qs = searchParams?.toString();
    return qs ? `${pathname}?${qs}` : pathname || "/";
  })();

  const isAdminOrEditor =
    user?.role === "ADMIN" ||
    user?.role === "SUPERADMIN" ||
    user?.role === "EDITOR";

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-200 ${
        hasScrolled || !isHomePage
          ? "bg-background h-16 shadow-sm backdrop-blur-sm"
          : "bg-background h-20"
      }`}
    >
      <div className="mx-auto h-full px-4 sm:px-8">
        <div
          className={`h-full items-center ${
            hasScrolled || !isHomePage
              ? "flex justify-between gap-6 sm:gap-12"
              : "grid grid-cols-3"
          }`}
        >
          {/* Left section - Logo */}
          <div className="flex justify-start">
            <div
              className={`font-extrabold transition-all duration-200 ${
                hasScrolled || !isHomePage ? "text-lg" : "text-2xl"
              }`}
            >
              {hasScrolled || !isHomePage ? (
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
                  <Link href="/" className="hidden sm:block">
                    Sharply
                  </Link>
                  <Link href="/" className="sm:hidden">
                    <Logo className="fill-foreground h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Logo className="fill-foreground h-4 w-4" />
                  <Link href="/">Sharply</Link>
                </div>
              )}
            </div>
          </div>

          {/* Middle section - Navigation/Search */}
          <div className="flex w-full max-w-4xl justify-center">
            {hasScrolled || !isHomePage ? (
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
                  {isAdminOrEditor && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      icon={<LayoutDashboard />}
                    >
                      <Link href="/admin">Admin</Link>
                    </Button>
                  )}
                  <UserMenu user={user} />
                </>
              ) : (
                <>
                  <Button size="sm" asChild icon={<LogIn />}>
                    <Link
                      href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                    >
                      Sign In
                    </Link>
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
