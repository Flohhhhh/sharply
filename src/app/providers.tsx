"use client";

import { SessionProvider } from "next-auth/react";
import { type ReactNode } from "react";
import { CommandPalette } from "~/components/search/command-palette";
import { CompareProvider } from "~/lib/hooks/useCompare";
import { ThemeProvider } from "~/lib/providers/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <SessionProvider>
        <CompareProvider>
          {children}
          {/* Mount a single global Command Palette so ⌘K/Ctrl+K works app-wide */}
          <CommandPalette />
        </CompareProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
