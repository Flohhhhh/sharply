import Link from "next/link";
import { Flame } from "lucide-react";
import { fetchTrending } from "~/server/popularity/service";
import type { TrendingEntry } from "~/types/popularity";
import type { GearType } from "~/types/gear";

export type TrendingItem = TrendingEntry;

function Skeleton({
  rows = 10,
  title = "Trending",
}: {
  rows?: number;
  title?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <span className="text-muted-foreground text-xs">loading…</span>
      </div>
      <ol className="divide-border divide-y rounded-md border">
        {Array.from({ length: rows }).map((_, idx) => (
          <li key={idx} className="flex items-center gap-3 p-2">
            <div className="text-muted-foreground w-6 text-right text-sm tabular-nums">
              {idx + 1}
            </div>
            <div className="flex min-w-0 flex-1">
              <div className="bg-muted h-4 w-40 rounded" />
            </div>
            <div className="ml-auto flex items-center gap-1">
              {[0, 1, 2].map((n) => (
                <Flame key={n} className="text-muted-foreground/40 h-4 w-4" />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function TrendingList({
  timeframe = "30d",
  limit = 10,
  filters,
  title = "Trending",
  loading = false,
  rows,
}: {
  timeframe?: "7d" | "30d";
  limit?: number;
  filters?: {
    brandId?: string;
    mountId?: string;
    gearType?: GearType;
  };
  title?: string;
  loading?: boolean;
  rows?: number;
}) {
  if (loading) return <Skeleton rows={rows} title={title} />;

  const items = await fetchTrending({ timeframe, limit, filters });

  if (!items.length) return null;

  const topScore = items[0]?.score ?? 0;
  const calcFilled = (score: number) => {
    if (topScore <= 0) return 0;
    const scaled = (score / topScore) * 3;
    return Math.max(0, Math.min(3, Math.round(scaled)));
  };
  const numberFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="text-muted-foreground text-xs">
          as of {items[0]!.asOfDate}
        </span>
      </div>
      <ol className="divide-border divide-y rounded-md border">
        {items.map((item, idx) => {
          const filled = calcFilled(item.score);
          return (
            <li key={item.gearId} className="p-0">
              <Link
                href={`/gear/${item.slug}`}
                className="group flex items-center gap-3 p-2"
              >
                <div className="text-muted-foreground tabular w-6 text-right text-sm">
                  {idx + 1}
                </div>
                <div className="flex min-w-0 flex-1">
                  <span className="truncate text-sm font-medium group-hover:underline">
                    {item.name}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {[0, 1, 2].map((n) => (
                    <Flame
                      key={n}
                      className={
                        n < filled
                          ? "h-4 w-4 text-orange-500"
                          : "text-muted-foreground/40 h-4 w-4"
                      }
                    />
                  ))}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
