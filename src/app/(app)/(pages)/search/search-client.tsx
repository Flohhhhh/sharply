"use client";

import { useQueryState } from "nuqs";
import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import useSwr from "swr";
import useSWRInfinite from "swr/infinite";
import { SearchResults } from "./search-results";
import { useEffect, useMemo, useRef } from "react";
import { buildSearchHref } from "~/lib/utils/url";
import { useDebounce } from "~/lib/hooks/useDebounce";
import { SearchIcon } from "lucide-react";
import { Spinner } from "~/components/ui/spinner";
import { FiltersSidebar } from "./filters-sidebar";
import { Separator } from "~/components/ui/separator";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const fetcherJson = (url: string) => fetch(url).then((res) => res.json());
const PAGE_SIZE = 24;

export function SearchClient() {
  const [q, setQ] = useQueryState("q");
  const [sort, setSort] = useQueryState("sort") ?? "relevance";
  const [page, setPage] = useQueryState("page") ?? 1;
  const [brand, setBrand] = useQueryState("brand");
  const [mount, setMount] = useQueryState("mount");
  const [gearType, setGearType] = useQueryState("gearType");
  const [sensorFormat, setSensorFormat] = useQueryState("sensorFormat");
  const [priceMin, setPriceMin] = useQueryState("priceMin");
  const [priceMax, setPriceMax] = useQueryState("priceMax");
  const debouncedQ = useDebounce(q, 300);

  const mappedGearType = useMemo(() => {
    switch (gearType) {
      case "all":
        return undefined;
      case "camera":
        return "CAMERA";
      case "lens":
        return "LENS";
      case "analog-camera":
        return "ANALOG_CAMERA";
      default:
        return undefined;
    }
  }, [gearType]);

  const getKey = useMemo(() => {
    return (pageIndex: number) => {
      const base = "/api/search";

      return buildSearchHref(base, {
        q: debouncedQ,
        sort,
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        brand,
        mount,
        gearType: mappedGearType,
        sensorFormat,
        priceMin,
        priceMax,
      });
    };
  }, [
    q,
    sort,
    brand,
    mount,
    mappedGearType,
    sensorFormat,
    priceMin,
    priceMax,
  ]);

  const {
    data,
    error,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite(getKey, fetcher, {
    initialSize: Number(page) || 1,
    revalidateFirstPage: true,
  });

  const flattenedResults =
    data?.flatMap((d: any) => d?.results ?? []) ?? [];
  const latestPage = data?.[data.length - 1];
  const totalPages = latestPage?.totalPages ?? 0;
  const currentPage = latestPage?.page ?? 1;
  const isLoadingInitial = !data && !error;
  const isLoadingMore =
    isLoadingInitial ||
    (size > 0 && data && typeof data[size - 1] === "undefined");
  const isReachingEnd =
    data && data.length > 0
      ? currentPage >= totalPages ||
        (latestPage?.results?.length ?? 0) < PAGE_SIZE
      : false;

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    if (isReachingEnd || isLoadingMore) return;

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first && first.isIntersecting) {
        setSize((prev) => prev + 1);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [isReachingEnd, isLoadingMore, setSize]);

  const { data: trendingData } = useSwr(
    "/api/trending?timeframe=30d&perPage=200",
    fetcherJson,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  );

  return (
    <div className="space-y-10">
      <section className="mx-auto max-w-5xl space-y-4 px-4 text-center sm:px-8">
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
          {isLoadingInitial && (
            <div className="absolute top-0 right-6 bottom-0 z-20 flex items-center justify-center">
              <Spinner className="size-6" />
            </div>
          )}
          <Input
            value={q ?? ""}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for a camera, lens, or other gear"
            className="h-16 rounded-2xl px-12"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 border-t px-4 sm:grid-cols-3 sm:px-8 lg:grid-cols-5">
        <div className="col-span-1 hidden h-full sm:block">
          <FiltersSidebar />
        </div>
        <div className="col-span-1 h-full min-h-screen px-3 sm:col-span-2 lg:col-span-4">
          <SearchResults
            results={flattenedResults}
            isLoading={isLoadingInitial}
            error={error}
            trendingSlugs={
              Array.isArray(trendingData?.items)
                ? trendingData.items.map((item: any) => item.slug)
                : []
            }
            isLoadingMore={isLoadingMore}
            isReachingEnd={isReachingEnd}
          />
          <div ref={loadMoreRef} className="h-12 w-full" aria-hidden />
        </div>
      </section>
    </div>
  );
}
