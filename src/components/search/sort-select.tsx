"use client";

import { useSearchParams, useRouter } from "next/navigation";
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
  const current = (sp.get("sort") ?? "relevance") as
    | "relevance"
    | "name"
    | "newest";

  function onChange(next: string) {
    const existing = new URLSearchParams(sp.toString());
    const qs = mergeSearchParams(existing, { sort: next, page: 1 });
    const href = qs ? `/search?${qs}` : "/search";
    router.replace(href);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <ArrowUpDown className="h-4 w-4 opacity-60" />
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="relevance">Relevance</SelectItem>
        <SelectItem value="name">Name</SelectItem>
        <SelectItem value="newest">Newest</SelectItem>
      </SelectContent>
    </Select>
  );
}
