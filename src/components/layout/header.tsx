"use client";

import { useScrollState } from "@/lib/hooks/useScrollState";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";
import { GlobalSearchBar } from "../search/global-search-bar";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const { hasScrolled } = useScrollState(200);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

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
                  {/* Menu button - hidden on mobile when scrolled */}
                  <Menu className="hidden size-4 md:block" />
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
              <nav className="hidden space-x-6 md:flex">
                <a href="#" className="hover:text-gray-600">
                  Home
                </a>
                <a href="#" className="hover:text-gray-600">
                  About
                </a>
                <a href="#" className="hover:text-gray-600">
                  Contact
                </a>
              </nav>
            )}
          </div>

          {/* Right section - Auth buttons or Mobile menu */}
          <div className="flex justify-end">
            {hasScrolled || !isHomePage ? (
              <>
                {/* Mobile menu button - visible on mobile when scrolled */}
                <Button variant="outline" size="sm" className="md:hidden">
                  <Menu className="size-4" />
                </Button>
                {/* Desktop auth buttons - hidden on mobile when scrolled */}
                <div className="hidden items-center gap-2 md:flex">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                  <Button size="sm">Sign up</Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Login
                </Button>
                <Button size="sm">Sign up</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
