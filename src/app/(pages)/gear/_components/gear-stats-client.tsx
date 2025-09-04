"use client";

import { useEffect, useState } from "react";

type Props = {
  slug: string;
  lifetimeViews: number;
  views30d: number;
  wishlistTotal: number;
  ownershipTotal: number;
};

export default function GearStatsClient(props: Props) {
  const [wishlistTotal, setWishlistTotal] = useState(props.wishlistTotal);
  const [ownershipTotal, setOwnershipTotal] = useState(props.ownershipTotal);

  useEffect(() => {
    function onWishlist(e: Event) {
      const detail = (e as CustomEvent<{ delta: 1 | -1; slug: string }>).detail;
      if (!detail || detail.slug !== props.slug) return;
      setWishlistTotal((v) => Math.max(0, v + detail.delta));
    }
    function onOwnership(e: Event) {
      const detail = (e as CustomEvent<{ delta: 1 | -1; slug: string }>).detail;
      if (!detail || detail.slug !== props.slug) return;
      setOwnershipTotal((v) => Math.max(0, v + detail.delta));
    }

    window.addEventListener("gear:wishlist", onWishlist as EventListener);
    window.addEventListener("gear:ownership", onOwnership as EventListener);
    return () => {
      window.removeEventListener("gear:wishlist", onWishlist as EventListener);
      window.removeEventListener(
        "gear:ownership",
        onOwnership as EventListener,
      );
    };
  }, [props.slug]);

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <div className="text-muted-foreground">Lifetime views</div>
        <div className="font-medium tabular-nums">{props.lifetimeViews}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Views (30d)</div>
        <div className="font-medium tabular-nums">{props.views30d}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Wishlists</div>
        <div className="font-medium tabular-nums">{wishlistTotal}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Owners</div>
        <div className="font-medium tabular-nums">{ownershipTotal}</div>
      </div>
    </div>
  );
}
