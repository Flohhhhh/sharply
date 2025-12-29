"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { mergeSearchParams } from "@utils/url";
import { LENS_FOCAL_LENGTH_SORT } from "~/lib/browse/sort-constants";
import { ArrowUpDown } from "lucide-react";

type SortSelectProps = {
  category?: "cameras" | "lenses" | null;
  hasMount?: boolean;
};

type SortValue =
  | "relevance"
  | "name"
  | "newest"
  | "price_asc"
  | "price_desc"
  | typeof LENS_FOCAL_LENGTH_SORT;

export function SortSelect({ category, hasMount }: SortSelectProps) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isBrowse = pathname.startsWith("/browse");
  const defaultSort: SortValue = isBrowse
    ? category === "lenses" && hasMount
      ? LENS_FOCAL_LENGTH_SORT
      : "newest"
    : "relevance";
  const incoming = (sp.get("sort") ?? defaultSort) as SortValue;
  const current =
    isBrowse && incoming === "name" ? defaultSort : incoming;

  function onChange(next: string) {
    const existing = new URLSearchParams(sp.toString());
    const qs = mergeSearchParams(existing, { sort: next, page: 1 });
    const base = isBrowse ? pathname : "/search";
    const href = qs ? `${base}?${qs}` : base;
    router.replace(href);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <ArrowUpDown className="h-4 w-4 opacity-60" />
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {!isBrowse && <SelectItem value="relevance">Relevance</SelectItem>}
        {isBrowse && category === "lenses" && (
          <SelectItem value={LENS_FOCAL_LENGTH_SORT}>
            Focal length: Low → High
          </SelectItem>
        )}
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="price_asc">Price: Low → High</SelectItem>
        <SelectItem value="price_desc">Price: High → Low</SelectItem>
        {!isBrowse && <SelectItem value="name">Name</SelectItem>}
      </SelectContent>
    </Select>
  );
}
