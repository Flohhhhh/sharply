"use client";

import { BanknoteCheck, Eye, Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useReducer } from "react";
import useSWR from "swr";

type Props = {
  slug: string;
  lifetimeViews?: number;
  views30d?: number;
  wishlistTotal?: number;
  ownershipTotal?: number;
};

type StatsState = {
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
  const t = useTranslations("gearDetail");
  const locale = useLocale();
  const [stats, dispatch] = useReducer(statsReducer, {
    lifetimeViews: props.lifetimeViews ?? 0,
    views30d: props.views30d ?? 0,
    wishlistTotal: props.wishlistTotal ?? 0,
    ownershipTotal: props.ownershipTotal ?? 0,
  });
  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [locale],
  );

  const { data, error, isLoading, mutate } = useSWR<Partial<StatsState>>(
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

  const hasInitialStats =
    props.lifetimeViews !== undefined &&
    props.views30d !== undefined &&
    props.wishlistTotal !== undefined &&
    props.ownershipTotal !== undefined;

  // Stats are intentionally client-fetched. Keep their allotted space as a
  // skeleton until a real response arrives, including after a failed request,
  // rather than briefly presenting misleading zeroes.
  if (!hasInitialStats && (isLoading || !data || error)) {
    return (
      <div className="space-y-2 py-1" aria-label={t("popularity")}>
        <div className="bg-muted h-9 animate-pulse rounded" />
        <div className="bg-muted h-9 animate-pulse rounded" />
        <div className="bg-muted h-9 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="py-1 text-sm">
      <div className="flex items-center gap-2 py-2">
        <Eye
          aria-hidden="true"
          className="text-muted-foreground size-4 shrink-0"
        />
        <span className="text-muted-foreground min-w-0 flex-1">
          {t("viewsAllTime")}
        </span>
        <span className="font-medium tabular-nums">
          {numberFormatter.format(stats.lifetimeViews)}
        </span>
      </div>
      {/* Temporarily hidden while the compact popularity layout is evaluated.
      <div className="border-border flex items-center gap-2 border-t py-2">
        <CalendarDays
          aria-hidden="true"
          className="text-muted-foreground size-4 shrink-0"
        />
        <span className="text-muted-foreground min-w-0 flex-1">
          {t("views30Days")}
        </span>
        <span className="font-medium tabular-nums">
          {numberFormatter.format(stats.views30d)}
        </span>
      </div>
      */}

      <div className="border-border flex items-center gap-2 border-t py-2">
        <Heart
          aria-hidden="true"
          className="text-muted-foreground size-4 shrink-0"
        />
        <span className="text-muted-foreground min-w-0 flex-1">
          {t("wishlists")}
        </span>
        <span className="font-medium tabular-nums">
          {numberFormatter.format(stats.wishlistTotal)}
        </span>
      </div>
      <div className="border-border flex items-center gap-2 border-t py-2">
        <BanknoteCheck
          aria-hidden="true"
          className="text-muted-foreground size-4 shrink-0"
        />
        <span className="text-muted-foreground min-w-0 flex-1">
          {t("owners")}
        </span>
        <span className="font-medium tabular-nums">
          {numberFormatter.format(stats.ownershipTotal)}
        </span>
      </div>
    </div>
  );
}
