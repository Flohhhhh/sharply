"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "~/i18n/config";
import {
  defaultLocale,
  localeCookieName,
  localeLabels,
  locales,
} from "~/i18n/config";
import { useLocalePathnames } from "~/i18n/client";
import { localizePathname } from "~/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pathname } = useLocalePathnames();

  const handleLocaleChange = (nextLocale: string) => {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    const query = searchParams.toString();
    const nextPathname = localizePathname(pathname, nextLocale as Locale);
    const nextHref = query ? `${nextPathname}?${query}` : nextPathname;

    router.push(nextHref);
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger
        size="sm"
        className="h-9 min-w-[88px] border px-2.5"
        aria-label={t("language")}
      >
        <SelectValue placeholder={localeLabels[defaultLocale].shortLabel} />
      </SelectTrigger>
      <SelectContent align="end">
        {locales.map((value) => (
          <SelectItem key={value} value={value}>
            {localeLabels[value].shortLabel} · {localeLabels[value].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
