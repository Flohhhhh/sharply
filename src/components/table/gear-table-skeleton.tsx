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
      className="space-y-px [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
    >
      {showHeader ? <Skeleton className="h-10 w-full rounded-none" /> : null}
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-none" />
      ))}
    </div>
  );
}
