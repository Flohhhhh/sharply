"use client";

import { useEffect, useRef, useState } from "react";
import type { GearType } from "~/types/gear";
import { TrendingBadge } from "./trending-badge";

export type TrendingBadgeQuery = {
  timeframe?: "7d" | "30d";
  limit?: number;
  filters?: {
    brandId?: string;
    mountId?: string;
    gearType?: GearType;
  };
};

type PendingRequest = {
  slug: string;
  resolve: (isTrending: boolean) => void;
  reject: (error: unknown) => void;
};

type EnhancedStatus = {
  key: string;
  isTrending: boolean;
};

const pendingByQuery = new Map<string, PendingRequest[]>();
const MAX_SLUGS_PER_REQUEST = 50;
let flushScheduled = false;

function normalizeQuery(query: TrendingBadgeQuery) {
  return {
    timeframe: query.timeframe ?? "30d",
    limit: query.limit ?? 20,
    brandId: query.filters?.brandId,
    mountId: query.filters?.mountId,
    gearType: query.filters?.gearType,
  };
}

function requestLiveStatus(slug: string, query: TrendingBadgeQuery) {
  const normalized = normalizeQuery(query);
  const key = JSON.stringify(normalized);

  const result = new Promise<boolean>((resolve, reject) => {
    const pending = pendingByQuery.get(key) ?? [];
    pending.push({ slug, resolve, reject });
    pendingByQuery.set(key, pending);
  });

  if (!flushScheduled) {
    flushScheduled = true;
    queueMicrotask(() => {
      void flushLiveStatusRequests();
    });
  }

  return result;
}

async function flushLiveStatusRequests() {
  flushScheduled = false;
  const groups = Array.from(pendingByQuery.entries());
  pendingByQuery.clear();

  await Promise.all(
    groups.map(async ([key, requests]) => {
      const query = JSON.parse(key) as ReturnType<typeof normalizeQuery>;
      const slugs = Array.from(new Set(requests.map(({ slug }) => slug)));
      const chunks = Array.from(
        { length: Math.ceil(slugs.length / MAX_SLUGS_PER_REQUEST) },
        (_, index) =>
          slugs.slice(
            index * MAX_SLUGS_PER_REQUEST,
            (index + 1) * MAX_SLUGS_PER_REQUEST,
          ),
      );

      await Promise.all(
        chunks.map(async (chunk) => {
          const chunkSet = new Set(chunk);
          const chunkRequests = requests.filter(({ slug }) =>
            chunkSet.has(slug),
          );
          const search = new URLSearchParams({
            timeframe: query.timeframe,
            limit: String(query.limit),
          });
          for (const slug of chunk) search.append("slug", slug);
          if (query.brandId) search.set("brandId", query.brandId);
          if (query.mountId) search.set("mountId", query.mountId);
          if (query.gearType) search.set("gearType", query.gearType);

          try {
            const response = await fetch(`/api/trending/status?${search}`, {
              cache: "no-store",
            });
            if (!response.ok) {
              throw new Error(
                `Trending status request failed: ${response.status}`,
              );
            }
            const payload = (await response.json()) as {
              trendingSlugs: string[];
            };
            const trendingSlugs = new Set(payload.trendingSlugs);
            for (const request of chunkRequests) {
              request.resolve(trendingSlugs.has(request.slug));
            }
          } catch (error) {
            for (const request of chunkRequests) request.reject(error);
          }
        }),
      );
    }),
  );
}

export function LiveTrendingBadge({
  slug,
  initialIsTrending,
  query = {},
  source = "baseline",
}: {
  slug: string;
  initialIsTrending: boolean;
  query?: TrendingBadgeQuery;
  source?: "baseline" | "live";
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [enhancedStatus, setEnhancedStatus] = useState<EnhancedStatus | null>(
    null,
  );
  const timeframe = query.timeframe;
  const limit = query.limit;
  const brandId = query.filters?.brandId;
  const mountId = query.filters?.mountId;
  const gearType = query.filters?.gearType;
  const statusKey = JSON.stringify([
    slug,
    initialIsTrending,
    normalizeQuery({
      timeframe,
      limit,
      filters: { brandId, mountId, gearType },
    }),
  ]);
  const isTrending =
    source === "live" || enhancedStatus?.key !== statusKey
      ? initialIsTrending
      : enhancedStatus.isTrending;

  useEffect(() => {
    if (source === "live") return;
    const anchor = anchorRef.current;
    if (!anchor) return;

    let active = true;
    const loadStatus = () => {
      void requestLiveStatus(slug, {
        timeframe,
        limit,
        filters: { brandId, mountId, gearType },
      })
        .then((nextStatus) => {
          if (active) {
            setEnhancedStatus({ key: statusKey, isTrending: nextStatus });
          }
        })
        .catch(() => undefined);
    };

    if (!("IntersectionObserver" in window)) {
      loadStatus();
      return () => {
        active = false;
      };
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      loadStatus();
    });
    observer.observe(anchor);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [brandId, gearType, limit, mountId, slug, source, statusKey, timeframe]);

  return (
    <span
      ref={anchorRef}
      className={isTrending ? "inline-flex" : "inline-flex size-px"}
      data-trending-status-source={source}
      aria-live="polite"
    >
      {isTrending ? <TrendingBadge /> : null}
    </span>
  );
}
