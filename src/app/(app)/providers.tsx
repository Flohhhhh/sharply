"use client";

import { type ReactNode } from "react";
import { CommandPalette } from "~/components/search/command-palette";
import { CompareProvider } from "~/lib/hooks/useCompare";
import { ThemeProvider } from "~/lib/providers/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <CompareProvider>
        {children}
        {/* Mount a single global Command Palette so ⌘K/Ctrl+K works app-wide */}
        <CommandPalette />
      </CompareProvider>
    </ThemeProvider>
  );
}
