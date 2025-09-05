import {
  searchGear,
  type SearchResponse,
  type SearchResult,
} from "~/server/search/service";
import { FilterPills } from "~/components/search/filter-pills";
import { FiltersModal } from "~/components/search/filters-modal";
import { SortSelect } from "~/components/search/sort-select";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
    const result: SearchResponse = await searchGear({
      query: q,
      sort,
      page,
      pageSize,
      filters: Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined),
      ) as Parameters<typeof searchGear>[0]["filters"],
    });

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

    return (
      <div className="0 mx-auto h-screen px-4 py-8 sm:px-8">
        <h1 className="mb-4 text-2xl font-semibold">Search</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          {q ? `Results for "${q}"` : "Browse all gear"} — {result.total} item
          {result.total === 1 ? "" : "s"}
        </p>

        {/* Controls row */}
        <div className="mb-2 flex items-center justify-end gap-2">
          <SortSelect />
          <FiltersModal />
        </div>
        {/* Active filter pills row */}
        <div className="mb-6">
          <FilterPills />
        </div>

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
                      <a
                        key={r.id}
                        href={`/gear/${r.slug}`}
                        className="border-border hover:bg-accent rounded-md border p-4 transition-colors"
                      >
                        <div className="bg-muted mb-2 h-32 w-full overflow-hidden rounded" />
                        <div className="text-muted-foreground text-sm">
                          {r.brandName ?? ""}
                        </div>
                        <div className="text-base font-medium">{r.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {r.mountValue ?? ""} · {r.gearType}
                          {r.relevance !== undefined && (
                            <span className="ml-2 text-xs opacity-70">
                              ({Math.round(r.relevance * 100)}%)
                            </span>
                          )}
                        </div>
                      </a>
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
                    .filter((r: SearchResult) => (r.relevance ?? 0) <= 0.8)
                    .map((r: SearchResult) => (
                      <a
                        key={r.id}
                        href={`/gear/${r.slug}`}
                        className="border-border hover:bg-accent rounded-md border p-4 transition-colors"
                      >
                        <div className="bg-muted mb-2 h-32 w-full overflow-hidden rounded" />
                        <div className="text-muted-foreground text-sm">
                          {r.brandName ?? ""}
                        </div>
                        <div className="text-base font-medium">{r.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {r.mountValue ?? ""} · {r.gearType}
                          {r.relevance !== undefined && (
                            <span className="ml-2 text-xs opacity-70">
                              ({Math.round(r.relevance * 100)}%)
                            </span>
                          )}
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Default grid for non-relevance sorting */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.results.map((r: SearchResult) => (
              <a
                key={r.id}
                href={`/gear/${r.slug}`}
                className="border-border hover:bg-accent rounded-md border p-4 transition-colors"
              >
                <div className="bg-muted mb-2 h-32 w-full overflow-hidden rounded" />
                <div className="text-muted-foreground text-sm">
                  {r.brandName ?? ""}
                </div>
                <div className="text-base font-medium">{r.name}</div>
                <div className="text-muted-foreground text-xs">
                  {r.mountValue ?? ""} · {r.gearType}
                  {r.relevance !== undefined && (
                    <span className="ml-2 text-xs opacity-70">
                      ({Math.round(r.relevance * 100)}%)
                    </span>
                  )}
                </div>
              </a>
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
              href={result.page <= 1 ? "#" : `/search?${prevParams.toString()}`}
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
      </div>
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
