"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { CommandPalette } from "~/components/search/command-palette";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-border bg-card border-b px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo/Brand */}
        <Link href="/" className="text-xl font-bold">
          Sharply
        </Link>

        {/* Global Search */}
        <div className="flex-1 px-6">
          <GlobalSearchBar />
        </div>

        {/* Auth Controls */}
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-muted-foreground text-sm">
                Welcome back, {session.user.name}!
              </span>
              <Link
                href={`/u/${session.user.id}`}
                className="border-input bg-background hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
              >
                View Profile
              </Link>
              <button
                onClick={() => signOut()}
                className="border-input bg-background hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("discord")}
              className="border-input bg-background hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
      {/* Command Palette (portaled dialog) */}
      <CommandPalette />
    </header>
  );
}
