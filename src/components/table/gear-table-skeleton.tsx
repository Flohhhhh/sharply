"use client";

import { Skeleton } from "~/components/ui/skeleton";
import type { GearTableScope } from "./gear-table-types";

export function GearTableSkeleton({
  rows = 10,
  showHeader = true,
}: {
  /** Kept for call-site compatibility while loading scope is unknown. */
  scope?: GearTableScope;
  rows?: number;
  showHeader?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none space-y-3 [mask-image:linear-gradient(to_bottom,black_0%,black_58%,transparent_100%)] py-4 [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_58%,transparent_100%)]"
    >
      {showHeader ? (
        <Skeleton className="bg-muted/40 dark:bg-muted/30 h-8 w-full rounded-lg" />
      ) : null}
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          className="bg-muted/45 dark:bg-muted/35 h-11 w-full rounded-lg"
        />
      ))}
    </div>
  );
}
