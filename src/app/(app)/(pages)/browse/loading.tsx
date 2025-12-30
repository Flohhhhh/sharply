import { Select, SelectTrigger, SelectValue } from "~/components/ui/select";
import { ClockIcon, FlameIcon, Link } from "lucide-react";
import { GearCardSkeleton } from "~/components/gear/gear-card";
import { Button } from "~/components/ui/button";

export default function Loading() {
  return (
    <main className="space-y-8">
      {/* Hero */}
      <section className="max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold sm:text-5xl">Browse Gear</h1>
        <p className="text-muted-foreground">
          Browse our comprehensive gear catalog featuring the latest cameras and
          lenses from all major brands. Results are ordered by release date by
          default with newer items appearing first.
        </p>
      </section>
      {/* Brand picker */}
      <section className="relative rounded-2xl">
        <div className="relative grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="border-border hover:bg-accent/40 group block rounded-lg border p-4 text-center"
                >
                  <div className="text-lg font-semibold group-hover:underline">
                    Loading...
                  </div>
                  <div className="text-muted-foreground mt-1 text-sm">
                    Loading...
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Other brands" />
                </SelectTrigger>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <span>
              <FlameIcon className="size-5 text-orange-500" />
            </span>
            Trending Gear
          </h2>
          <span className="text-sm">View All</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <GearCardSkeleton key={index} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <ClockIcon className="text-muted-foreground size-5" />
            Latest releases
          </h2>
        </div>
        <div className="space-y-4">
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 24 }).map((_, index) => (
              <GearCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
