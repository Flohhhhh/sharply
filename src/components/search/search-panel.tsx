"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

type SearchPanelProps = {
  children: ReactNode;
  compact?: boolean;
  className?: string;
};

type SearchPanelSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

type SearchPanelMessageProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
};

export function SearchPanel({
  children,
  compact = false,
  className,
}: SearchPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[26px] border border-white/8 bg-black/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_28%)]",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200",
        compact ? "p-2" : "p-3",
        className,
      )}
    >
      <div className="relative space-y-2">{children}</div>
    </div>
  );
}

export function SearchPanelSection({
  title,
  description,
  children,
  className,
}: SearchPanelSectionProps) {
  return (
    <section className={cn("space-y-2", className)}>
      {(title || description) && (
        <div className="px-2 pt-1">
          {title ? (
            <div className="text-muted-foreground text-[11px] font-medium">
              {title}
            </div>
          ) : null}
          {description ? (
            <p className="text-muted-foreground mt-1 text-xs">{description}</p>
          ) : null}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </section>
  );
}

export function SearchPanelMessage({
  title,
  description,
  icon,
  className,
}: SearchPanelMessageProps) {
  return (
    <div
      className={cn(
        "flex min-h-28 flex-col items-center justify-center gap-2 px-4 py-6 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="text-muted-foreground flex size-10 items-center justify-center rounded-full border border-border/70 bg-muted/40">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-medium tracking-[-0.01em]">{title}</p>
        {description ? (
          <p className="text-muted-foreground text-xs leading-5">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SearchPanelLoading({
  title = "Searching",
  description = "Fetching the best matches for your query.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <SearchPanelMessage
      title={title}
      description={description}
      icon={<Loader2 className="size-4 animate-spin" />}
      className={className}
    />
  );
}
