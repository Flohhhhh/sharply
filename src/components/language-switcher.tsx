"use client";

import { useLocale,useTranslations } from "next-intl";
import { useRouter,useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CircleFlag } from "react-circle-flags";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import { useLocalePathnames } from "~/i18n/client";
import type { Locale } from "~/i18n/config";
import { localeCookieName } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";
import { useCountry } from "~/lib/hooks/useCountry";
import {
  getLanguageMarketOptionForLocale,
  getLocaleById,
  LANGUAGE_MARKET_OPTIONS,
  type LanguageMarketOption,
} from "~/lib/locale/locales";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pathname } = useLocalePathnames();
  const { localeId, setLocaleId } = useCountry();
  const selectedOption = getLanguageMarketOptionForLocale(locale, localeId);

  useEffect(() => {
    if (selectedOption.localeId !== localeId) {
      setLocaleId(selectedOption.localeId);
    }
  }, [localeId, selectedOption.localeId, setLocaleId]);

  const handleLocaleChange = (nextValue: string) => {
    const nextOption = LANGUAGE_MARKET_OPTIONS.find(
      (option) => option.id === nextValue,
    );
    if (!nextOption) return;

    setLocaleId(nextOption.localeId);
    document.cookie = `${localeCookieName}=${nextOption.locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    const query = searchParams.toString();
    const nextPathname = localizePathname(pathname, nextOption.locale);
    const nextHref = query ? `${nextPathname}?${query}` : nextPathname;

    router.push(nextHref);
  };

  return (
    <Select value={selectedOption.id} onValueChange={handleLocaleChange}>
      <SelectTrigger
        size="sm"
        className="h-9 min-w-[210px] border px-2.5"
        aria-label={t("languageRegion")}
      >
        <SelectedLanguageMarket option={selectedOption} />
      </SelectTrigger>
      <SelectContent align="end">
        {LANGUAGE_MARKET_OPTIONS.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            <SelectedLanguageMarket option={option} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SelectedLanguageMarket({
  option,
}: {
  option: LanguageMarketOption;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
        <CircleFlag countryCode={getFlagCode(option)} height={20} />
      </span>
      <span className="truncate">{option.label}</span>
    </span>
  );
}

function getFlagCode(option: LanguageMarketOption): string {
  const localeOption = getLocaleById(option.localeId);

  if (option.localeId === "eu") return "eu";
  if (localeOption?.countryCode) return localeOption.countryCode.toLowerCase();
  if (localeOption?.affiliateCountryCode) {
    return localeOption.affiliateCountryCode.toLowerCase();
  }

  return "us";
}
