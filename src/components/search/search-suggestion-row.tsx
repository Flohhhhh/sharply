"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import { cn } from "~/lib/utils";

export type SearchSuggestionKind =
  | "camera"
  | "lens"
  | "brand"
  | "smart-action"
  | "search-action"
  | "recent";

export type SearchSuggestionTone =
  | "default"
  | "best-match"
  | "smart-action"
  | "search-action"
  | "recent";

export type SearchSuggestionRowProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  actionLabel?: string;
  meta?: string;
  hint?: string;
  kind?: SearchSuggestionKind;
  tone?: SearchSuggestionTone;
  selected?: boolean;
  compact?: boolean;
  surface?: "card" | "inline";
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
};

const toneClasses: Record<SearchSuggestionTone, string> = {
  default:
    "border-transparent bg-transparent text-foreground/95 data-[selected=true]:text-foreground",
  "best-match":
    "border-black/12 bg-transparent text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:border-white/18 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
  "smart-action":
    "border-sky-500/16 bg-linear-to-r from-sky-500/12 via-cyan-500/[0.05] to-transparent text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
  "search-action":
    "border-white/6 bg-white/[0.04] text-foreground/90",
  recent:
    "border-transparent bg-transparent text-foreground/92",
};

function DefaultIcon({ kind }: { kind: SearchSuggestionKind }) {
  if (kind === "smart-action") {
    return <Sparkles className="size-4" />;
  }
  if (kind === "search-action") {
    return <ArrowUpRight className="size-4" />;
  }
  if (kind === "recent") {
    return <Clock3 className="size-4" />;
  }
  return null;
}

export function SearchSuggestionRow({
  title,
  subtitle,
  badge,
  actionLabel,
  meta,
  hint,
  kind = "camera",
  tone = "default",
  selected = false,
  compact = false,
  surface = "card",
  leadingIcon,
  trailingIcon,
  className,
}: SearchSuggestionRowProps) {
  const icon = leadingIcon ?? <DefaultIcon kind={kind} />;
  const inlineEmbossClass =
    "hover:border-black/10 hover:bg-black/[0.035] hover:shadow-[0_1px_0_rgba(255,255,255,0.42),inset_0_1px_0_rgba(255,255,255,0.22)] dark:hover:border-white/14 dark:hover:bg-white/[0.05] dark:hover:shadow-[0_1px_0_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.08)] data-[selected=true]:border-black/12 data-[selected=true]:bg-black/[0.045] data-[selected=true]:shadow-[0_1px_0_rgba(255,255,255,0.42),inset_0_1px_0_rgba(255,255,255,0.22)] dark:data-[selected=true]:border-white/16 dark:data-[selected=true]:bg-white/[0.06] dark:data-[selected=true]:shadow-[0_1px_0_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.08)]";

  return (
    <div
      data-selected={selected}
      data-tone={tone}
      data-kind={kind}
      className={cn(
        "group/search-row relative flex min-w-0 items-center gap-1.5 overflow-hidden transition-[border-color,transform,box-shadow,opacity,color] duration-200 ease-out motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200",
        surface === "card"
          ? "rounded-[20px] border px-2 py-2.5 before:pointer-events-none before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-linear-to-r before:from-white/18 before:via-white/6 before:to-transparent before:opacity-70"
          : "rounded-2xl border-0 px-2 py-2 before:hidden",
        compact ? "px-3 py-2" : "px-2 py-1.5",
        toneClasses[tone],
        surface === "inline" &&
        "!border-0 bg-transparent shadow-none ring-0",
        surface === "inline" && inlineEmbossClass,
        surface === "inline" &&
        tone === "default" &&
        "text-foreground/88 hover:text-foreground data-[selected=true]:text-foreground",
        surface === "inline" &&
        tone === "best-match" &&
        "text-foreground ring-1 ring-black/28 dark:ring-white/70 hover:text-foreground data-[selected=true]:border-black/20 data-[selected=true]:text-foreground dark:data-[selected=true]:border-white/20",
        surface === "inline" &&
        tone === "smart-action" &&
        "from-transparent via-transparent to-transparent text-foreground hover:text-foreground data-[selected=true]:text-foreground",
        surface === "inline" &&
        tone === "search-action" &&
        "text-foreground/82 hover:text-foreground data-[selected=true]:text-foreground",
        className,
      )}
    >
      {(icon ?? trailingIcon) && (
        <div
          className={cn(
            "text-muted-foreground flex shrink-0 items-center justify-center",
            surface === "card" &&
            "rounded-[14px] border border-white/8 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
            surface === "inline" && "rounded-none border-none bg-transparent shadow-none",
            compact ? "size-8" : "size-9",
          )}
        >
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "truncate font-medium tracking-[-0.01em]",
              compact ? "text-sm" : "text-[0.95rem]",
            )}
          >
            {title}
          </div>
          {badge && surface === "card" ? (
            <span
              className={cn(
                "text-muted-foreground inline-flex shrink-0 items-center text-[10px] font-medium",
                surface === "card" &&
                "rounded-full border border-current/12 bg-white/[0.05] px-2 py-0.5",
                surface === "inline" &&
                "rounded-full border border-current/10 bg-white/[0.04] px-1.5 py-0.5",
              )}
            >
              {badge}
            </span>
          ) : null}
        </div>

        {(subtitle || meta) && (
          <div className="flex items-center gap-2 text-xs">
            {subtitle ? (
              <span className="text-muted-foreground truncate">{subtitle}</span>
            ) : null}
            {subtitle && meta ? (
              <span className="text-muted-foreground/45 shrink-0">•</span>
            ) : null}
            {meta ? (
              <span className="text-muted-foreground truncate font-medium">
                {meta}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {(hint || trailingIcon || (surface === "inline" && actionLabel)) && (
        <div className="ml-auto flex shrink-0 items-center gap-2 pr-4">
          {surface === "inline" && actionLabel ? (
            <span
              className={cn(
                "hidden text-[11px] font-medium tracking-[-0.01em] text-black/55 transition-opacity duration-150 dark:text-white/65 md:inline-flex",
                "opacity-0 group-hover/search-row:opacity-100 group-data-[selected=true]/search-row:opacity-100",
              )}
            >
              {actionLabel}
            </span>
          ) : null}
          {hint ? (
            <span className="text-muted-foreground rounded-full border border-current/12 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium">
              {hint}
            </span>
          ) : null}
          {trailingIcon ? (
            <div className="text-muted-foreground flex items-center justify-center">
              {trailingIcon}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
