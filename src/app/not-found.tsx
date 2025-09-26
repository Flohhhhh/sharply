"use client";

import Link from "next/link";
import { Bird, Home, Search } from "lucide-react";

import { Button } from "~/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full">
        <Bird className="h-16 w-16 blur-[2px]" />
      </div>
      <p className="text-primary text-sm font-semibold tracking-wide">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance md:text-4xl">
        Oops, we missed the shot.
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-pretty">
        The page you’re looking for flew the coop. Try searching for gear, or
        head back home.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" /> Go to Home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            href="/search"
            onClick={(e) => {
              // Open command palette for immediate search when landing on search
              // Use a small timeout to ensure navigation completes first
              setTimeout(() => {
                document.dispatchEvent(
                  new CustomEvent("sharply:open-command-palette"),
                );
              }, 250);
            }}
          >
            <Search className="mr-2 h-4 w-4" /> Search gear
          </Link>
        </Button>
      </div>
    </div>
  );
}
