"use client";

import { toast } from "sonner";
import type { BadgeDefinition } from "~/types/badges";
import { BADGE_CATALOG } from "~/lib/badges/catalog";
import { BadgeTile } from "~/components/badges/badge-tile";
import Link from "next/link";

export function BadgeToast({ badge }: { badge: BadgeDefinition }) {
  return (
    <div className="flex items-center gap-4">
      <BadgeTile badge={badge} />
      <div className="flex min-w-0 flex-col">
        <div className="text-foreground text-sm font-semibold">
          Earned: {badge.label}
        </div>
        {badge.description ? (
          <div className="text-muted-foreground line-clamp-2 text-xs">
            {badge.description}
          </div>
        ) : null}
        <Link
          href={`/profile`}
          className="text-muted-foreground pt-2 text-xs hover:underline"
        >
          View on profile
        </Link>
      </div>
    </div>
  );
}

export function showBadgeToast(badge: BadgeDefinition) {
  toast(<BadgeToast badge={badge} />, {
    duration: 15000,
  });
}

export function showBadgeToastByKey(key: string) {
  const badge = BADGE_CATALOG.find((b) => b.key === key);
  if (badge) {
    showBadgeToast(badge);
  } else {
    toast("Badge earned!", { description: key });
  }
}

// Helper: announce multiple awards at once
export function announceAwards(keys: string[] | undefined | null) {
  if (!keys || keys.length === 0) return;
  keys.forEach((key) => showBadgeToastByKey(key));
}

// Helper: wrap a promise (e.g., server action) that resolves to an object containing { awarded }
// Example usage:
// const res = await withBadgeToasts(actionToggleWishlist(slug));
// // res is whatever the original action returned, and toasts have already been shown
export async function withBadgeToasts<T extends { awarded?: string[] }>(
  promise: Promise<T>,
): Promise<T> {
  const res = await promise;
  announceAwards(res.awarded);
  return res;
}
