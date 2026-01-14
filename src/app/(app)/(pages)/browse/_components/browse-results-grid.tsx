"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { Loader } from "lucide-react";
import { GearCard } from "~/components/gear/gear-card";
import { Button } from "~/components/ui/button";
import { getItemDisplayPrice } from "~/lib/mapping";
import { useIsMobile } from "~/hooks/use-mobile";

type GearListItem = {
  id: string;
  slug: string;
  name: string;
  brandName?: string | null;
  gearType: string | null;
  thumbnailUrl: string | null;
  releaseDate: string | null;
  releaseDatePrecision: "DAY" | "MONTH" | "YEAR" | null;
  announcedDate: string | null;
  announcedDatePrecision: "DAY" | "MONTH" | "YEAR" | null;
  msrpNowUsdCents: number | null;
  mpbMaxPriceUsdCents: number | null;
};

export type BrowseListPage = {
  items: GearListItem[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
};

type BrowseResultsGridProps = {
  initialPage: BrowseListPage;
  brandName?: string;
  baseQuery: string;
  trendingSlugs?: string[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return (await res.json()) as BrowseListPage;
};

const MAX_AUTO_SCROLL_LOADS = 5;

export function BrowseResultsGrid({
  initialPage,
  brandName,
  baseQuery,
  trendingSlugs,
}: BrowseResultsGridProps) {
  const isMobile = useIsMobile();
  const [infiniteActive, setInfiniteActive] = useState(false);
  const [autoScrollLoads, setAutoScrollLoads] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const autoScrollLoadsRef = useRef(0);

  const buildKey = useCallback(
    (pageIndex: number) => {
      const params = new URLSearchParams(baseQuery);
      params.set("view", "list");
      params.set("page", String(initialPage.page + pageIndex));
      const qs = params.toString();
      return `/api/gear/browse${qs ? `?${qs}` : ""}`;
    },
    [baseQuery, initialPage.page],
  );

  const { data, error, size, setSize, isValidating } = useSWRInfinite<
    BrowseListPage,
    Error
  >((pageIndex) => buildKey(pageIndex), fetcher, {
    fallbackData: [initialPage],
    revalidateFirstPage: false,
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

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
          No gear found yet. Try adjusting your filters.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <GearCard
            key={g.id}
            href={`/gear/${g.slug}`}
            slug={g.slug}
            name={g.name}
            brandName={g.brandName ?? brandName}
            thumbnailUrl={g.thumbnailUrl ?? undefined}
            gearType={g.gearType ?? undefined}
            isTrending={trendingSet.has(g.slug)}
            releaseDate={g.releaseDate}
            releaseDatePrecision={g.releaseDatePrecision}
            announcedDate={g.announcedDate}
            announcedDatePrecision={g.announcedDatePrecision}
            priceText={getItemDisplayPrice(g, {
              style: "short",
              padWholeAmounts: true,
            })}
          />
        ))}
      </div>

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
