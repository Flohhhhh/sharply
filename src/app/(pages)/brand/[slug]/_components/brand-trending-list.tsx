import Link from "next/link";
import { unstable_cache } from "next/cache";
import { db } from "~/server/db";
import { gearPopularityWindows, gear, brands } from "~/server/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { Flame } from "lucide-react";

export type BrandTrendingItem = {
  gearId: string;
  slug: string;
  name: string;
  score: number;
  asOfDate: string;
};

const getBrandTrending = unstable_cache(
  async (brandId: string, timeframe: "7d" | "30d", limit: number) => {
    const scoreFormula = sql`(
      views_sum * 0.1 +
      wishlist_adds_sum * 2 +
      owner_adds_sum * 3 +
      compare_adds_sum * 1.5 +
      review_submits_sum * 2.5
    )`;

    const rows = await db
      .select({
        gearId: gearPopularityWindows.gearId,
        score: scoreFormula.as("score"),
        asOfDate: gearPopularityWindows.asOfDate,
        slug: gear.slug,
        name: gear.name,
      })
      .from(gearPopularityWindows)
      .innerJoin(gear, eq(gearPopularityWindows.gearId, gear.id))
      .innerJoin(brands, eq(gear.brandId, brands.id))
      .where(
        and(
          eq(brands.id, brandId),
          eq(gearPopularityWindows.timeframe, timeframe as any),
          sql`${gearPopularityWindows.asOfDate} = (
            SELECT MAX(as_of_date)
            FROM app.gear_popularity_windows
            WHERE timeframe = ${timeframe}::popularity_timeframe
          )`,
        ),
      )
      .orderBy(desc(scoreFormula))
      .limit(limit);

    return rows.map<BrandTrendingItem>((r) => ({
      gearId: r.gearId,
      slug: r.slug,
      name: r.name,
      score: Number(r.score),
      asOfDate: String(r.asOfDate),
    }));
  },
  ["brand-trending"],
  { revalidate: 60 * 60 * 12, tags: ["trending"] },
);

export default async function BrandTrendingList({
  brandId,
  timeframe = "30d",
  limit = 10,
}: {
  brandId: string;
  timeframe?: "7d" | "30d";
  limit?: number;
}) {
  const items = await getBrandTrending(brandId, timeframe, limit);
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
