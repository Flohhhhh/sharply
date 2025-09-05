import Link from "next/link";
import { Flame } from "lucide-react";
import { fetchTrending } from "~/server/popularity/service";

export type BrandTrendingItem = {
  gearId: string;
  slug: string;
  name: string;
  score: number;
  asOfDate: string;
};

export default async function BrandTrendingList({
  brandId,
  timeframe = "30d",
  limit = 10,
}: {
  brandId: string;
  timeframe?: "7d" | "30d";
  limit?: number;
}) {
  const raw = await fetchTrending({
    timeframe,
    limit,
    filters: { brandId },
  });
  const items: BrandTrendingItem[] = raw.map((r) => ({
    gearId: r.gearId,
    slug: r.slug,
    name: r.name,
    score: r.score,
    asOfDate: r.asOfDate,
  }));
  if (!items.length) return null;

  const top = items[0]?.score ?? 0;
  const filledFor = (x: number) => {
    if (top <= 0) return 0;
    return Math.max(0, Math.min(3, Math.round((x / top) * 3)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Trending (brand)</h2>
        <span className="text-muted-foreground text-xs">
          as of {items[0]!.asOfDate}
        </span>
      </div>
      <ol className="divide-border divide-y rounded-md border bg-white">
        {items.map((it, idx) => {
          const filled = filledFor(it.score);
          return (
            <li key={it.gearId} className="p-0">
              <Link
                href={`/gear/${it.slug}`}
                className="group flex items-center gap-3 p-2"
              >
                <div className="text-muted-foreground w-6 text-right text-sm tabular-nums">
                  {idx + 1}
                </div>
                <div className="flex min-w-0 flex-1">
                  <span className="truncate group-hover:underline">
                    {it.name}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-1">
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
