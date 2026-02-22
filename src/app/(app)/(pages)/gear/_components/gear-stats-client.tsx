"use client";

import { useEffect, useState } from "react";

type Props = {
  slug: string;
  viewsToday: number;
  lifetimeViews: number;
  views30d: number;
  wishlistTotal: number;
  ownershipTotal: number;
};

export default function GearStatsClient(props: Props) {
  const [viewsToday, setViewsToday] = useState(props.viewsToday);
  const [lifetimeViews, setLifetimeViews] = useState(props.lifetimeViews);
  const [views30d, setViews30d] = useState(props.views30d);
  const [wishlistTotal, setWishlistTotal] = useState(props.wishlistTotal);
  const [ownershipTotal, setOwnershipTotal] = useState(props.ownershipTotal);

  useEffect(() => {
    let cancelled = false;

    const refreshStats = async () => {
      try {
        const response = await fetch(
          `/api/gear/${encodeURIComponent(props.slug)}/stats`,
          {
            cache: "no-store",
          },
        );
        if (!response.ok) return;

        const data = (await response.json()) as Partial<Props>;
        if (cancelled) return;

        setViewsToday(Number(data.viewsToday ?? 0));
        setLifetimeViews(Number(data.lifetimeViews ?? 0));
        setViews30d(Number(data.views30d ?? 0));
        setWishlistTotal(Number(data.wishlistTotal ?? 0));
        setOwnershipTotal(Number(data.ownershipTotal ?? 0));
      } catch (error) {
        console.error("Failed to refresh gear stats:", error);
      }
    };

    function onWishlist(e: Event) {
      const detail = (e as CustomEvent<{ delta: 1 | -1; slug: string }>).detail;
      if (detail?.slug !== props.slug) return;
      setWishlistTotal((v) => Math.max(0, v + detail.delta));
    }
    function onOwnership(e: Event) {
      const detail = (e as CustomEvent<{ delta: 1 | -1; slug: string }>).detail;
      if (detail?.slug !== props.slug) return;
      setOwnershipTotal((v) => Math.max(0, v + detail.delta));
    }
    function onViewRecorded(e: Event) {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (detail?.slug !== props.slug) return;
      void refreshStats();
    }

    window.addEventListener("gear:wishlist", onWishlist as EventListener);
    window.addEventListener("gear:ownership", onOwnership as EventListener);
    window.addEventListener(
      "gear:view-recorded",
      onViewRecorded as EventListener,
    );

    void refreshStats();
    const delayedRefreshId = window.setTimeout(() => {
      void refreshStats();
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(delayedRefreshId);
      window.removeEventListener("gear:wishlist", onWishlist as EventListener);
      window.removeEventListener(
        "gear:ownership",
        onOwnership as EventListener,
      );
      window.removeEventListener(
        "gear:view-recorded",
        onViewRecorded as EventListener,
      );
    };
  }, [props.slug]);

  return (
    <div className="divide-border divide-y text-sm">
      <div className="flex items-center justify-between py-2">
        <div className="text-muted-foreground">Views (All Time)</div>
        <div className="font-medium tabular-nums">{lifetimeViews}</div>
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="text-muted-foreground">Views (30 Days)</div>
        <div className="font-medium tabular-nums">{views30d}</div>
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="text-muted-foreground">Views (Today)</div>
        <div className="font-medium tabular-nums">{viewsToday}</div>
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="text-muted-foreground">Wishlists</div>
        <div className="font-medium tabular-nums">{wishlistTotal}</div>
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="text-muted-foreground">Owners</div>
        <div className="font-medium tabular-nums">{ownershipTotal}</div>
      </div>
    </div>
  );
}
