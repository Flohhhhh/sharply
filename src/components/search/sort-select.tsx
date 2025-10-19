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
import { ArrowUpDown } from "lucide-react";

export function SortSelect() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isBrowse = pathname.startsWith("/browse");
  const current = (sp.get("sort") ?? (isBrowse ? "newest" : "relevance")) as
    | "relevance"
    | "name"
    | "newest"
    | "price_asc"
    | "price_desc";

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
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="price_asc">Price: Low → High</SelectItem>
        <SelectItem value="price_desc">Price: High → Low</SelectItem>
        <SelectItem value="name">Name</SelectItem>
      </SelectContent>
    </Select>
  );
}
