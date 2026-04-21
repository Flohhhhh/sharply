"use client";

import { Bird,Home,Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocaleLink } from "~/components/locale-link";
import { Button } from "~/components/ui/button";

export default function NotFound() {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full">
        <Bird className="h-16 w-16 blur-[2px]" />
      </div>
      <p className="text-primary text-sm font-semibold tracking-wide">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance md:text-4xl">
        {t("notFoundTitle")}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-pretty">
        {t("notFoundDescription")}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <LocaleLink href="/">
            <Home className="mr-2 h-4 w-4" /> {t("goHome")}
          </LocaleLink>
        </Button>
        <Button asChild variant="outline">
          <LocaleLink
            href="/search"
            onClick={() => {
              // Open command palette for immediate search when landing on search
              // Use a small timeout to ensure navigation completes first
              setTimeout(() => {
                document.dispatchEvent(
                  new CustomEvent("sharply:open-command-palette"),
                );
              }, 250);
            }}
          >
            <Search className="mr-2 h-4 w-4" /> {t("searchGear")}
          </LocaleLink>
        </Button>
      </div>
    </div>
  );
}
