"use client";

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
  href,
  type,
  relevance,
  className,
  onClick,
}: Props) {
  return (
    <div
      key={id}
      className={cn(
        "hover:bg-accent group/item flex w-full cursor-pointer items-center justify-between px-3",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate">{label}</span>
        {relevance !== undefined && (
          <span className="text-muted-foreground ml-2 text-xs">
            {Math.round(relevance * 100)}%
          </span>
        )}
      </div>
      {type === "gear" && (
        <span className="text-muted-foreground rounded-full border border-muted-foreground/20 px-2 py-0.5 text-[11px] uppercase tracking-wide opacity-0 transition-opacity group-hover/item:opacity-100">
          {type}
        </span>
      )}
    </div>
  );
}
