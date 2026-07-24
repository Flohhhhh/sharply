"use client";

import { useGearResultsView } from "~/components/table";
import { Skeleton } from "~/components/ui/skeleton";
import { SearchResultsSkeleton } from "./search-results-skeleton";

export function SearchPageSkeleton() {
  const { view } = useGearResultsView();

  return (
    <div className="min-h-screen space-y-10" aria-busy="true">
      <section className="mx-auto max-w-5xl px-4 sm:px-8">
        <Skeleton className="h-16 w-full rounded-2xl" />
      </section>
      <section className="px-4 sm:px-8">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-48" />
        </div>
      </section>
      <section className="grid grid-cols-1 border-t px-4 sm:grid-cols-3 sm:px-8 lg:grid-cols-5">
        <div className="col-span-1 hidden sm:block" />
        <div className="col-span-1 min-h-screen pl-4 sm:col-span-2 lg:col-span-4">
          <SearchResultsSkeleton view={view} />
        </div>
      </section>
    </div>
  );
}
