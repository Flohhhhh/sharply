"use client";

import { type ReactNode } from "react";
import { CommandPalette } from "~/components/search/command-palette";
import { CountryProvider } from "~/lib/hooks/useCountry";
import { CompareProvider } from "~/lib/hooks/useCompare";
import { ThemeProvider } from "~/lib/providers/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export function Providers({
  children,
  initialCountryAlpha2,
}: {
  children: ReactNode;
  initialCountryAlpha2?: string | null;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <CountryProvider initialCountryAlpha2={initialCountryAlpha2}>
        <NuqsAdapter>
          <CompareProvider>
            {children}
            {/* Mount a single global Command Palette so ⌘K/Ctrl+K works app-wide */}
            <CommandPalette />
          </CompareProvider>
        </NuqsAdapter>
      </CountryProvider>
    </ThemeProvider>
  );
}
