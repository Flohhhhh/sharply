"use client";

import { mergeSearchParams } from "@utils/url";
import { ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname,useRouter,useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useLocalePathnames } from "~/i18n/client";
import { LENS_FOCAL_LENGTH_SORT } from "~/lib/browse/sort-constants";

type SortSelectProps = {
  category?: "cameras" | "lenses" | null;
  hasMount?: boolean;
};

type SortValue =
  | "relevance"
  | "name"
  | "newest"
  | "oldest"
  | "recently_added"
  | "price_asc"
  | "price_desc"
  | typeof LENS_FOCAL_LENGTH_SORT;

export function SortSelect({ category, hasMount }: SortSelectProps) {
  return (
    <Suspense fallback={<SortSelectFallback />}>
      <SortSelectContent category={category} hasMount={hasMount} />
    </Suspense>
  );
}

function SortSelectContent({ category, hasMount }: SortSelectProps) {
  const tSearch = useTranslations("search");
  const tBrowse = useTranslations("browsePage");
  const sp = useSearchParams();
  const router = useRouter();
  const rawPathname = usePathname();
  const { pathname } = useLocalePathnames();
  const isBrowse = pathname.startsWith("/browse");
  const defaultSort: SortValue = isBrowse
    ? category === "lenses" && hasMount
      ? LENS_FOCAL_LENGTH_SORT
      : "newest"
    : "relevance";
  const incoming = (sp.get("sort") ?? defaultSort) as SortValue;
  const current = isBrowse && incoming === "name" ? defaultSort : incoming;

  function onChange(next: string) {
    const existing = new URLSearchParams(sp.toString());
    const qs = mergeSearchParams(existing, { sort: next, page: 1 });
    const base = isBrowse ? rawPathname : "/search";
    const href = qs ? `${base}?${qs}` : base;
    if (isBrowse) {
      window.history.pushState(null, "", href);
      return;
    }
    router.replace(href);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <ArrowUpDown className="h-4 w-4 opacity-60" />
        <SelectValue
          placeholder={isBrowse ? tBrowse("sortBy") : tSearch("sortBy")}
        />
      </SelectTrigger>
      <SelectContent>
        {!isBrowse && (
          <SelectItem value="relevance">{tSearch("relevance")}</SelectItem>
        )}
        {isBrowse && category === "lenses" && (
          <SelectItem value={LENS_FOCAL_LENGTH_SORT}>
            {tBrowse("focalLengthLowHigh")}
          </SelectItem>
        )}
        <SelectItem value="newest">
          {isBrowse ? tBrowse("newest") : tSearch("newest")}
        </SelectItem>
        {isBrowse && <SelectItem value="oldest">{tBrowse("oldest")}</SelectItem>}
        {isBrowse && (
          <SelectItem value="recently_added">
            {tBrowse("recentlyAdded")}
          </SelectItem>
        )}
        <SelectItem value="price_asc">
          {isBrowse ? tBrowse("priceLowHigh") : tSearch("priceLowHigh")}
        </SelectItem>
        <SelectItem value="price_desc">
          {isBrowse ? tBrowse("priceHighLow") : tSearch("priceHighLow")}
        </SelectItem>
        {!isBrowse && <SelectItem value="name">{tSearch("name")}</SelectItem>}
      </SelectContent>
    </Select>
  );
}

function SortSelectFallback() {
  return (
    <div className="border-input text-muted-foreground inline-flex h-10 w-[200px] items-center rounded-md border px-3 text-sm">
      <ArrowUpDown className="mr-2 h-4 w-4 opacity-60" />
      Sort by
    </div>
  );
}
