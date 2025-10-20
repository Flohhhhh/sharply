"use client";
import React from "react";
import type { Rating, Chart } from "@/lib/recommendations/types";
import Link from "next/link";
import { mergeDefaultColumns } from "@/lib/recommendations/bucketing";

const ratingClass = (r: Rating) =>
  r === "best value"
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : r === "best performance"
      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      : r === "situational"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-sky-500/10 text-sky-600 dark:text-sky-400"; // balanced

export function ChartView({ chart }: { chart: Chart }) {
  // derive columns by merging defaults with any custom extras
  const columns = React.useMemo(
    () => mergeDefaultColumns(chart.columns),
    [chart.columns],
  );

  const itemsByColumn = React.useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        rating: Rating;
        note?: string;
        priceDisplay?: string;
        priceLow?: number;
        slug?: string;
        thumbnailUrl?: string | null;
        focalDisplay?: string | undefined;
      }[]
    >();
    const allCols = [...columns.zoom, ...columns.prime];
    for (const col of allCols) map.set(col.key, []);
    for (const item of chart.items) {
      if (!item.column) continue;
      const list = map.get(item.column);
      if (!list) continue;
      list.push({
        name: item.name,
        rating: item.rating,
        note: item.note,
        priceDisplay: item.priceDisplay,
        priceLow: item.priceLow,
        slug: (item as any).slug,
        thumbnailUrl: (item as any).thumbnailUrl ?? null,
        focalDisplay: (item as any).focalDisplay,
      });
    }
    for (const [, list] of map)
      list.sort(
        (a, b) =>
          (a.priceLow ?? Number.MAX_SAFE_INTEGER) -
          (b.priceLow ?? Number.MAX_SAFE_INTEGER),
      );
    return map;
  }, [chart.items, columns]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold">{chart.title}</h1>
        <div className="text-muted-foreground text-sm">
          Updated {new Date(chart.updatedAt).toLocaleDateString()}
        </div>
      </header>

      {columns && (
        <div className="space-y-8">
          {/* Zoom grid */}
          {(() => {
            const cols = columns.zoom.filter(
              (c) => (itemsByColumn?.get(c.key)?.length ?? 0) > 0,
            );
            if (cols.length === 0) return null;
            return (
              <section className="space-y-3">
                <h2 className="text-lg font-medium">Zoom</h2>
                <div className="overflow-x-auto">
                  <div className="flex min-w-max gap-4 pb-2">
                    {cols.map((col) => (
                      <div
                        key={col.key}
                        className="w-72 shrink-0 rounded-md border p-3"
                      >
                        <div className="mb-2 text-sm font-medium">
                          {col.label}
                        </div>
                        <ul className="space-y-2">
                          {(itemsByColumn?.get(col.key) ?? []).map((it) => (
                            <li
                              key={it.name}
                              className="flex items-start gap-2"
                            >
                              <Link
                                href={it.slug ? `/gear/${it.slug}` : "#"}
                                className="block w-full"
                              >
                                <div
                                  className={`flex h-20 w-full flex-col justify-center overflow-hidden rounded-md p-3 ${ratingClass(
                                    it.rating,
                                  )}`}
                                >
                                  <div className="flex items-center gap-2">
                                    {it.thumbnailUrl && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={it.thumbnailUrl}
                                        alt=""
                                        className="h-8 w-8 rounded object-cover"
                                      />
                                    )}
                                    <div className="text-sm leading-5 font-medium">
                                      {it.name}
                                    </div>
                                  </div>
                                  {it.focalDisplay && (
                                    <div className="text-muted-foreground text-xs">
                                      {it.focalDisplay}
                                    </div>
                                  )}
                                  {it.priceDisplay && (
                                    <div className="text-muted-foreground text-xs">
                                      {it.priceDisplay}
                                    </div>
                                  )}
                                  {it.note && (
                                    <div className="text-muted-foreground text-xs">
                                      {it.note}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })()}

          {/* Prime grid */}
          {(() => {
            const cols = columns.prime.filter(
              (c) => (itemsByColumn?.get(c.key)?.length ?? 0) > 0,
            );
            if (cols.length === 0) return null;
            return (
              <section className="space-y-3">
                <h2 className="text-lg font-medium">Prime</h2>
                <div className="overflow-x-auto">
                  <div className="flex min-w-max gap-4 pb-2">
                    {cols.map((col) => (
                      <div
                        key={col.key}
                        className="w-72 shrink-0 rounded-md border p-3"
                      >
                        <div className="mb-2 text-sm font-medium">
                          {col.label}
                        </div>
                        <ul className="space-y-2">
                          {(itemsByColumn?.get(col.key) ?? []).map((it) => (
                            <li
                              key={it.name}
                              className="flex items-start gap-2"
                            >
                              <Link
                                href={it.slug ? `/gear/${it.slug}` : "#"}
                                className="block w-full"
                              >
                                <div
                                  className={`flex h-20 w-full flex-col justify-center overflow-hidden rounded-md p-3 ${ratingClass(
                                    it.rating,
                                  )}`}
                                >
                                  <div className="text-sm leading-5 font-medium">
                                    {it.name}
                                  </div>
                                  {it.priceDisplay && (
                                    <div className="text-muted-foreground text-xs">
                                      {it.priceDisplay}
                                    </div>
                                  )}
                                  {it.note && (
                                    <div className="text-muted-foreground text-xs">
                                      {it.note}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })()}
        </div>
      )}
    </div>
  );
}
