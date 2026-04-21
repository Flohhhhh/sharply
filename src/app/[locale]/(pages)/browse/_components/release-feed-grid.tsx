"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { Loader } from "lucide-react";
import { GearCard } from "~/components/gear/gear-card";
import { Button } from "~/components/ui/button";
import { getItemDisplayPrice } from "~/lib/mapping";
import type { BrowseFeedPage } from "~/types/browse";
import { useIsMobile } from "~/hooks/use-mobile";

type ReleaseFeedGridProps = {
  initialPage: BrowseFeedPage;
  brandSlug?: string;
  trendingSlugs?: string[];
};

const PAGE_SIZE = 12;
const MAX_AUTO_SCROLL_LOADS = 5;

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return (await res.json()) as BrowseFeedPage;
};

export function ReleaseFeedGrid({
  initialPage,
  brandSlug,
  trendingSlugs,
}: ReleaseFeedGridProps) {
  const isMobile = useIsMobile();
  const [infiniteActive, setInfiniteActive] = useState(false);
  const [autoScrollLoads, setAutoScrollLoads] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const autoScrollLoadsRef = useRef(0);

  const buildKey = useCallback(
    (offset: number) => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (brandSlug) params.set("brandSlug", brandSlug);
      return `/api/gear/browse?${params.toString()}`;
    },
    [brandSlug],
  );

  const { data, error, size, setSize, isValidating } = useSWRInfinite<
    BrowseFeedPage,
    Error
  >(
    (pageIndex) => {
      const offset = pageIndex * PAGE_SIZE;
      return buildKey(offset);
    },
    fetcher,
    {
      fallbackData: [initialPage],
      revalidateFirstPage: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    },
  );

  const pages = data ?? [initialPage];
  const items = useMemo(
    () => pages.flatMap((page) => page?.items ?? []),
    [pages],
  );
  const trendingSet = useMemo(
    () => new Set(trendingSlugs ?? []),
    [trendingSlugs],
  );
  const lastPage = pages[pages.length - 1] ?? initialPage;
  const hasMore = lastPage?.hasMore ?? false;
  const isLoadingMore = isValidating && pages.length < size;
  const showEmpty = !items.length && !error && !isValidating;

  useEffect(() => {
    loadingRef.current = isLoadingMore;
  }, [isLoadingMore]);

  // Disable infinite scroll on mobile
  const hasReachedAutoLoadLimit = autoScrollLoads >= MAX_AUTO_SCROLL_LOADS;

  useEffect(() => {
    if (isMobile || !infiniteActive || !hasMore || hasReachedAutoLoadLimit)
      return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && !loadingRef.current) {
          const nextAutoLoadCount = autoScrollLoadsRef.current + 1;
          autoScrollLoadsRef.current = nextAutoLoadCount;
          setAutoScrollLoads(nextAutoLoadCount);
          if (nextAutoLoadCount >= MAX_AUTO_SCROLL_LOADS) {
            setInfiniteActive(false);
          }
          void setSize((current) => current + 1);
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, infiniteActive, setSize, isMobile, hasReachedAutoLoadLimit]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    // On desktop, enable infinite scroll after first manual load
    if (!isMobile) {
      setInfiniteActive(true);
      autoScrollLoadsRef.current = 0;
      setAutoScrollLoads(0);
    }
    void setSize((current) => current + 1);
  }, [hasMore, isLoadingMore, setSize, isMobile]);

  const errorText = error ? "Unable to load more gear right now." : null;

  return (
    <div className="space-y-4">
      {errorText ? (
        <div className="text-destructive text-sm">{errorText}</div>
      ) : null}

      {showEmpty ? (
        <div className="text-muted-foreground text-sm">
          No gear found yet. Try another brand or check back soon.
        </div>
      ) : null}

      <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <GearCard
            key={g.id}
            href={`/gear/${g.slug}`}
            slug={g.slug}
            name={g.name}
            regionalAliases={g.regionalAliases}
            brandName={g.brandName ?? undefined}
            thumbnailUrl={g.thumbnailUrl ?? undefined}
            gearType={g.gearType}
            isTrending={trendingSet.has(g.slug)}
            releaseDate={g.releaseDate}
            releaseDatePrecision={g.releaseDatePrecision}
            announcedDate={g.announcedDate}
            announceDatePrecision={g.announceDatePrecision}
            priceText={getItemDisplayPrice(g, {
              style: "short",
              padWholeAmounts: true,
            })}
          />
        ))}
      </div>

      {/* Always show button when more items available, or when infinite scroll is not active on desktop */}
      {hasMore && (isMobile || !infiniteActive) ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      ) : null}

      {/* Only show infinite scroll sentinel on desktop when active */}
      {!isMobile && infiniteActive ? (
        <div className="flex flex-col items-center gap-2">
          {isLoadingMore ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader className="h-4 w-4 animate-spin" />
              Loading more gear...
            </div>
          ) : null}
          <div ref={sentinelRef} className="h-6 w-full" />
        </div>
      ) : null}
    </div>
  );
}
