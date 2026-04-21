"use client";

import { Camera,SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchSuggestionRow } from "~/components/search/search-suggestion-row";
import { cn } from "~/lib/utils";

type Props = {
  id: string;
  label: string;
  href: string;
  type: "gear" | "brand";
  relevance?: number;
  className?: string;
  onClick: () => void;
};

export function GlobalSearchSuggestion({
  id,
  label,
  type,
  className,
  onClick,
}: Props) {
  const t = useTranslations("search");
  const kind = type === "gear" ? "camera" : "brand";

  return (
    <button
      type="button"
      key={id}
      className={cn(
        "group/item w-full rounded-2xl text-left outline-none",
        className,
      )}
      onClick={onClick}
    >
      <SearchSuggestionRow
        title={label}
        kind={kind}
        badge={type === "gear" ? t("gearBadge") : t("brandBadge")}
        leadingIcon={
          type === "gear" ? (
            <Camera className="size-4" />
          ) : (
            <SearchIcon className="size-4" />
          )
        }
        className="group-hover/item:border-border/80 group-hover/item:bg-accent/60"
      />
    </button>
  );
}
