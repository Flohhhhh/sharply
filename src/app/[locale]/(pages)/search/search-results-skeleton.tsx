import { GearCardSkeleton } from "~/components/gear/gear-card";
import { GearTableSkeleton, type GearResultsView } from "~/components/table";

const SEARCH_SKELETON_KEYS = Array.from(
  { length: 16 },
  (_, index) => `search-results-skeleton-${index + 1}`,
);

export function SearchResultsSkeleton({ view }: { view: GearResultsView }) {
  if (view === "list") {
    return (
      <div data-testid="search-results-skeleton" data-view={view}>
        <GearTableSkeleton />
      </div>
    );
  }

  return (
    <div
      data-testid="search-results-skeleton"
      data-view={view}
      className="relative grid grid-cols-1 gap-1 pt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <div className="from-background absolute right-0 bottom-0 left-0 z-10 h-full bg-linear-to-t to-transparent" />
      {SEARCH_SKELETON_KEYS.map((key) => (
        <GearCardSkeleton key={key} />
      ))}
    </div>
  );
}
