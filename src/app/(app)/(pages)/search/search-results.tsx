import { toast } from "sonner";
import { GearCard, GearCardSkeleton } from "~/components/gear/gear-card";
import { useEffect } from "react";
import { type SearchResult } from "~/server/search/service";
import { Empty, EmptyTitle, EmptyDescription } from "~/components/ui/empty";
import { getItemDisplayPrice } from "~/lib/mapping/price-map";

type SearchResultsProps = {
  results: SearchResult[];
  isLoading: boolean;
  error: Error | null;
  trendingSlugs?: string[];
  isLoadingMore?: boolean;
  isReachingEnd?: boolean;
};
export function SearchResults(props: SearchResultsProps) {
  const {
    results,
    isLoading,
    error,
    trendingSlugs = [],
    isLoadingMore = false,
    isReachingEnd = false,
  } = props;
  const trendingSet = new Set(trendingSlugs);

  useEffect(() => {
    if (error?.message) {
      toast.error(error.message);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="relative grid grid-cols-1 gap-1 pt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="from-background absolute right-0 bottom-0 left-0 z-10 h-full bg-linear-to-t to-transparent" />
        {Array.from({ length: 16 }).map((_, index) => (
          <GearCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Empty className="h-[calc(100vh-300px)]">
        <EmptyTitle>No gear found</EmptyTitle>
        <EmptyDescription>Try adjusting your filters.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((item) => (
          <GearCard
            key={item.id}
            href={`/gear/${item.slug}`}
            slug={item.slug}
            name={item.name}
            brandName={item.brandName}
            thumbnailUrl={item.thumbnailUrl}
            isTrending={trendingSet.has(item.slug)}
            priceText={getItemDisplayPrice(
              {
                msrpNowUsdCents: item.msrpNowUsdCents ?? null,
                mpbMaxPriceUsdCents: item.mpbMaxPriceUsdCents ?? null,
              },
              { style: "short" },
            )}
            releaseDate={item.releaseDate ?? null}
            releaseDatePrecision={(item.releaseDatePrecision as any) ?? null}
            announcedDate={item.announcedDate ?? null}
            announceDatePrecision={(item.announceDatePrecision as any) ?? null}
          />
        ))}
      </div>
      {isLoadingMore && (
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 24 }).map((_, index) => (
            <GearCardSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}
      {isReachingEnd && results.length > 0 && (
        <div className="text-muted-foreground py-24 text-center text-sm">
          You have reached the end.
        </div>
      )}
    </div>
  );
}
