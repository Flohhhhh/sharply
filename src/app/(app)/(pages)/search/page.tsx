import Link from "next/link";
import type { Metadata } from "next";
import { Bird, Home, Library } from "lucide-react";

import {
  searchGear,
  type SearchResponse,
  type SearchResult,
} from "~/server/search/service";
import { FilterPills } from "~/components/search/filter-pills";
import { FiltersModal } from "~/components/search/filters-modal";
import { SortSelect } from "~/components/search/sort-select";
import FilterSidebar from "~/components/layout/FilterSidebar";
import { Button } from "~/components/ui/button";
import { GearCard } from "~/components/gear/gear-card";
import { fetchTrendingSlugs } from "~/server/popularity/service";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Search",
  openGraph: {
    title: "Search",
  },
};

function toStringParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = toStringParam(params.q) ?? "";
  const sort = (toStringParam(params.sort) ?? "relevance") as
    | "relevance"
    | "name"
    | "newest";
  const showDebugScores = process.env.NODE_ENV !== "production";
  const page = parseInt(toStringParam(params.page) ?? "1", 10) || 1;
  const pageSize = 20;

  // Parse filters from searchParams
  const filters = {
    brand: toStringParam(params.brand),
    mount: toStringParam(params.mount),
    gearType: toStringParam(params.gearType),
    priceMin: params.priceMin
      ? parseFloat(toStringParam(params.priceMin)!)
      : undefined,
    priceMax: params.priceMax
      ? parseFloat(toStringParam(params.priceMax)!)
      : undefined,
    sensorFormat: toStringParam(params.sensorFormat),
  };

  try {
    const [result, trendingSlugs]: [SearchResponse, string[]] =
      await Promise.all([
        searchGear({
          query: q,
          sort,
          page,
          pageSize,
          filters: Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== undefined),
          ) as Parameters<typeof searchGear>[0]["filters"],
        }),
        fetchTrendingSlugs({ timeframe: "30d", limit: 20 }),
      ]);
    const trendingSet = new Set(trendingSlugs);

    // Build base URLSearchParams from incoming searchParams to preserve all filters
    const baseParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (Array.isArray(val)) {
        for (const v of val) if (v != null) baseParams.append(key, v);
      } else if (typeof val === "string") {
        baseParams.set(key, val);
      }
    }

    const prevParams = new URLSearchParams(baseParams);
    if (result.page > 1) prevParams.set("page", String(result.page - 1));
    const nextParams = new URLSearchParams(baseParams);
    if (result.page < result.totalPages)
      nextParams.set("page", String(result.page + 1));

    const hasResults = result.total > 0;

    return (
      <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-4 pt-20 sm:px-6">
        <>
          <h1 className="text-3xl font-semibold">
            {q ? `Search results for "${q}"` : "Search"}
          </h1>
          <div className="mb-2 flex items-center justify-end gap-2">
            <SortSelect />
            <FiltersModal />
          </div>
          <div className="mb-6">
            <FilterPills />
          </div>
          <p className="text-muted-foreground text-sm">
            Showing {result.total} result{result.total === 1 ? "" : "s"}
          </p>
          {hasResults ? (
            <>
              {/* Results grouped by relevance */}
              {sort === "relevance" && result.results.length > 0 ? (
                <>
                  {/* Best Matches - High relevance results */}
                  {result.results.filter(
                    (r: SearchResult) => (r.relevance ?? 0) > 0.8,
                  ).length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-foreground mb-4 text-lg font-semibold">
                        Best Matches
                      </h2>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {result.results
                          .filter((r: SearchResult) => (r.relevance ?? 0) > 0.8)
                          .map((r: SearchResult) => (
                            <GearCard
                              key={r.id}
                              href={`/gear/${r.slug}`}
                              slug={r.slug}
                              name={r.name}
                              brandName={r.brandName}
                              thumbnailUrl={r.thumbnailUrl}
                              gearType={r.gearType}
                              isTrending={trendingSet.has(r.slug)}
                              metaRight={
                                showDebugScores
                                  ? (r.relevance ?? 0).toFixed(3)
                                  : undefined
                              }
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Other Results - Lower relevance results */}
                  {result.results.filter(
                    (r: SearchResult) => (r.relevance ?? 0) <= 0.8,
                  ).length > 0 && (
                    <div>
                      <h2 className="text-muted-foreground mb-4 text-lg font-semibold">
                        Other Results
                      </h2>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {result.results
                          .filter(
                            (r: SearchResult) => (r.relevance ?? 0) <= 0.8,
                          )
                          .map((r: SearchResult) => (
                            <GearCard
                              key={r.id}
                              href={`/gear/${r.slug}`}
                              slug={r.slug}
                              name={r.name}
                              brandName={r.brandName}
                              thumbnailUrl={r.thumbnailUrl}
                              gearType={r.gearType}
                              isTrending={trendingSet.has(r.slug)}
                              metaRight={
                                showDebugScores
                                  ? (r.relevance ?? 0).toFixed(3)
                                  : undefined
                              }
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Default grid for non-relevance sorting */
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {result.results.map((r: SearchResult) => (
                    <GearCard
                      key={r.id}
                      href={`/gear/${r.slug}`}
                      slug={r.slug}
                      name={r.name}
                      brandName={r.brandName}
                      thumbnailUrl={r.thumbnailUrl}
                      gearType={r.gearType}
                      isTrending={trendingSet.has(r.slug)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Page {result.page} of {result.totalPages}
                </span>
                <div className="flex gap-2">
                  <a
                    className="border-input hover:bg-accent rounded-md border px-3 py-1.5 text-sm aria-disabled:opacity-50"
                    aria-disabled={result.page <= 1}
                    href={
                      result.page <= 1
                        ? "#"
                        : `/search?${prevParams.toString()}`
                    }
                  >
                    Previous
                  </a>
                  <a
                    className="border-input hover:bg-accent rounded-md border px-3 py-1.5 text-sm aria-disabled:opacity-50"
                    aria-disabled={result.page >= result.totalPages}
                    href={
                      result.page >= result.totalPages
                        ? "#"
                        : `/search?${nextParams.toString()}`
                    }
                  >
                    Next
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="border-border bg-muted/30 flex min-h-[50vh] flex-col items-center justify-center gap-6 rounded-2xl border border-dashed px-8 py-10 text-center shadow-sm">
              <Bird className="text-foreground/60 h-20 w-20 blur-[2px]" />
              <h2 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
                {q ? `No results for “${q}”.` : "No gear found yet."}
              </h2>
              <p className="text-muted-foreground max-w-md">
                Try modifying your filters or search terms to tune the results.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="outline">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" /> Go Home
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  icon={<Library className="mr-2 h-4 w-4" />}
                >
                  <Link href="/browse">Browse all gear</Link>
                </Button>
              </div>
            </div>
          )}
        </>
      </main>
    );
  } catch (error) {
    console.error("Search error:", error);
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Search Error</h1>
        <p className="text-muted-foreground">
          Something went wrong with your search. Please try again.
        </p>
      </div>
    );
  }
}
