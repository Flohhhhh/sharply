"use client";

import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-7 items-center rounded-md border border-black/10 bg-black/[0.045] px-2 text-[12px] font-semibold tracking-[-0.01em] text-black/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/72 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        className,
      )}
      {...props}
    />
  );
}
