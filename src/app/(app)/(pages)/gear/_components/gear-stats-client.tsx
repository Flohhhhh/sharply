"use client";

import { useEffect, useReducer } from "react";
import useSWR from "swr";

type Props = {
  slug: string;
  viewsToday: number;
  lifetimeViews: number;
  views30d: number;
  wishlistTotal: number;
  ownershipTotal: number;
};

type StatsState = {
  viewsToday: number;
  lifetimeViews: number;
  views30d: number;
  wishlistTotal: number;
  ownershipTotal: number;
};

type StatsAction =
  | { type: "sync"; data: Partial<StatsState> }
  | { type: "adjust_wishlist"; delta: 1 | -1 }
  | { type: "adjust_ownership"; delta: 1 | -1 };

function statsReducer(state: StatsState, action: StatsAction): StatsState {
  switch (action.type) {
    case "sync":
      return {
        viewsToday: Number(action.data.viewsToday ?? state.viewsToday),
        lifetimeViews: Number(action.data.lifetimeViews ?? state.lifetimeViews),
        views30d: Number(action.data.views30d ?? state.views30d),
        wishlistTotal: Number(action.data.wishlistTotal ?? state.wishlistTotal),
        ownershipTotal: Number(
          action.data.ownershipTotal ?? state.ownershipTotal,
        ),
      };
    case "adjust_wishlist":
      return {
        ...state,
        wishlistTotal: Math.max(0, state.wishlistTotal + action.delta),
      };
    case "adjust_ownership":
      return {
        ...state,
        ownershipTotal: Math.max(0, state.ownershipTotal + action.delta),
      };
  }
}

const fetcher = async (url: string): Promise<Partial<StatsState>> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return (await res.json()) as Partial<StatsState>;
};

export default function GearStatsClient(props: Props) {
  const [stats, dispatch] = useReducer(statsReducer, {
    viewsToday: props.viewsToday,
    lifetimeViews: props.lifetimeViews,
    views30d: props.views30d,
    wishlistTotal: props.wishlistTotal,
    ownershipTotal: props.ownershipTotal,
  });

  const { mutate } = useSWR<Partial<StatsState>>(
    `/api/gear/${encodeURIComponent(props.slug)}/stats`,
    fetcher,
    {
      revalidateOnFocus: false,
      onSuccess: (data) => dispatch({ type: "sync", data }),
    },
  );

  useEffect(() => {
    function onWishlist(e: Event) {
      const detail = (e as CustomEvent<{ delta: 1 | -1; slug: string }>).detail;
      if (detail?.slug !== props.slug) return;
      dispatch({ type: "adjust_wishlist", delta: detail.delta });
    }
    function onOwnership(e: Event) {
      const detail = (e as CustomEvent<{ delta: 1 | -1; slug: string }>).detail;
      if (detail?.slug !== props.slug) return;
      dispatch({ type: "adjust_ownership", delta: detail.delta });
    }
    function onViewRecorded(e: Event) {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (detail?.slug !== props.slug) return;
      void mutate();
    }

    window.addEventListener("gear:wishlist", onWishlist as EventListener);
    window.addEventListener("gear:ownership", onOwnership as EventListener);
    window.addEventListener(
      "gear:view-recorded",
      onViewRecorded as EventListener,
    );

    return () => {
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
  }, [props.slug, mutate]);

  return (
    <div className="divide-border divide-y text-sm">
      <div className="flex items-center justify-between py-2">
        <div className="text-muted-foreground">Views (All Time)</div>
        <div className="font-medium tabular-nums">{stats.lifetimeViews}</div>
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="text-muted-foreground">Views (30 Days)</div>
        <div className="font-medium tabular-nums">{stats.views30d}</div>
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="text-muted-foreground">Views (Today)</div>
        <div className="font-medium tabular-nums">{stats.viewsToday}</div>
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="text-muted-foreground">Wishlists</div>
        <div className="font-medium tabular-nums">{stats.wishlistTotal}</div>
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="text-muted-foreground">Owners</div>
        <div className="font-medium tabular-nums">{stats.ownershipTotal}</div>
      </div>
    </div>
  );
}
