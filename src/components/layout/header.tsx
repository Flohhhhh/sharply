"use client";

import { useScrollState } from "@/lib/hooks/useScrollState";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";
import { GlobalSearchBar } from "../search/global-search-bar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NavMenuDesktop } from "./nav-menu-desktop";
import { NavMenuMobile } from "./nav-menu-mobile";
import { NavSheetDesktop } from "./nav-sheet-desktop";

export default function Header() {
  const { hasScrolled } = useScrollState(200);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const sheetTopClass =
    hasScrolled || !isHomePage
      ? "top-16 h-[calc(100vh-4rem)]"
      : "top-24 h-[calc(100vh-6rem)]";

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-200 ${
        hasScrolled || !isHomePage
          ? "h-16 bg-white shadow-sm backdrop-blur-sm"
          : "h-24 bg-white"
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
              className={`font-bold transition-all duration-200 ${
                hasScrolled || !isHomePage ? "text-lg" : "text-2xl"
              }`}
            >
              {hasScrolled || !isHomePage ? (
                <div className="flex items-center gap-2">
                  {/* Desktop nav sheet trigger - hidden on mobile when scrolled */}
                  <NavSheetDesktop topClass={sheetTopClass}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden h-8 w-8 p-2 md:inline-flex"
                    >
                      <Menu className="size-4" />
                    </Button>
                  </NavSheetDesktop>
                  <Link href="/">Sharply</Link>
                </div>
              ) : (
                <Link href="/">Sharply</Link>
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
            <NavMenuMobile>
              <Button variant="outline" size="sm" className="md:hidden">
                <Menu className="size-4" />
              </Button>
            </NavMenuMobile>

            {/* Desktop auth buttons - only visible on desktop */}
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm">
                Login
              </Button>
              <Button size="sm">Sign up</Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
