import { unstable_cache } from "next/cache";
import { db } from "~/server/db";
import {
  gear,
  brands,
  wishlists,
  ownerships,
  gearPopularityWindows,
  gearPopularityDaily,
  gearPopularityLifetime,
} from "~/server/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export type TrendingFilters = {
  brandId?: string;
  mountId?: string;
  gearType?: "CAMERA" | "LENS";
};

export async function getTrendingData(
  timeframe: "7d" | "30d",
  limit: number,
  filters: TrendingFilters = {},
) {
  const key = [
    "pop-trending",
    timeframe,
    String(limit),
    filters.brandId ?? "-",
    filters.mountId ?? "-",
    filters.gearType ?? "-",
  ];

  const run = unstable_cache(
    async () => {
      const scoreFormula = sql`(
        views_sum * 0.1 +
        wishlist_adds_sum * 2 +
        owner_adds_sum * 3 +
        compare_adds_sum * 1.5 +
        review_submits_sum * 2.5
      )`;

      const conds: any[] = [
        eq(gearPopularityWindows.timeframe, timeframe as any),
        sql`${gearPopularityWindows.asOfDate} = (
          SELECT MAX(as_of_date)
          FROM app.gear_popularity_windows
          WHERE timeframe = ${timeframe}::popularity_timeframe
        )`,
      ];
      if (filters.brandId) conds.push(eq(gear.brandId, filters.brandId));
      if (filters.mountId) conds.push(eq(gear.mountId, filters.mountId));
      if (filters.gearType)
        conds.push(eq(gear.gearType, filters.gearType as any));

      const rows = await db
        .select({
          gearId: gearPopularityWindows.gearId,
          score: scoreFormula.as("score"),
          viewsSum: gearPopularityWindows.viewsSum,
          wishlistAddsSum: gearPopularityWindows.wishlistAddsSum,
          ownerAddsSum: gearPopularityWindows.ownerAddsSum,
          compareAddsSum: gearPopularityWindows.compareAddsSum,
          reviewSubmitsSum: gearPopularityWindows.reviewSubmitsSum,
          asOfDate: gearPopularityWindows.asOfDate,
          slug: gear.slug,
          name: gear.name,
          gearType: gear.gearType,
          brandId: gear.brandId,
          brandName: brands.name,
        })
        .from(gearPopularityWindows)
        .innerJoin(gear, eq(gearPopularityWindows.gearId, gear.id))
        .innerJoin(brands, eq(gear.brandId, brands.id))
        .where(and(...conds))
        .orderBy(desc(scoreFormula))
        .limit(limit);

      return rows.map((r) => ({
        gearId: r.gearId,
        slug: r.slug,
        name: r.name,
        brandName: r.brandName,
        gearType: r.gearType as "CAMERA" | "LENS",
        score: Number(r.score),
        stats: {
          views: Number(r.viewsSum),
          wishlistAdds: Number(r.wishlistAddsSum),
          ownerAdds: Number(r.ownerAddsSum),
          compareAdds: Number(r.compareAddsSum),
          reviewSubmits: Number(r.reviewSubmitsSum),
        },
        asOfDate: String(r.asOfDate),
      }));
    },
    key,
    { revalidate: 60 * 60 * 12, tags: ["trending"] },
  );

  return run();
}

export async function getGearStats(slug: string) {
  const key = ["gear-stats", slug];
  const run = unstable_cache(
    async () => {
      const gearRow = await db
        .select({ id: gear.id })
        .from(gear)
        .where(eq(gear.slug, slug))
        .limit(1);
      if (!gearRow.length) {
        return {
          gearId: "",
          lifetimeViews: 0,
          views30d: 0,
          wishlistTotal: 0,
          ownershipTotal: 0,
        };
      }
      const gearId = gearRow[0]!.id;

      const lifetimeRow = await db
        .select({ v: gearPopularityLifetime.viewsLifetime })
        .from(gearPopularityLifetime)
        .where(eq(gearPopularityLifetime.gearId, gearId))
        .limit(1);
      const lifetimeViews = Number(lifetimeRow[0]?.v ?? 0);

      const win30Row = await db
        .select({
          v: gearPopularityWindows.viewsSum,
          d: gearPopularityWindows.asOfDate,
        })
        .from(gearPopularityWindows)
        .where(
          and(
            eq(gearPopularityWindows.gearId, gearId),
            eq(gearPopularityWindows.timeframe, "30d" as any),
          ),
        )
        .orderBy(desc(gearPopularityWindows.asOfDate))
        .limit(1);
      let views30d = Number(win30Row[0]?.v ?? 0);

      if (!views30d) {
        const d30Row = await db
          .select({
            v: sql<number>`COALESCE(SUM(${gearPopularityDaily.views}), 0)`,
          })
          .from(gearPopularityDaily)
          .where(
            and(
              eq(gearPopularityDaily.gearId, gearId),
              gte(
                gearPopularityDaily.date,
                sql`CURRENT_DATE - INTERVAL '30 days'`,
              ),
            ),
          );
        views30d = Number(d30Row[0]?.v ?? 0);
      }

      const [wlRow, ownRow] = await Promise.all([
        db
          .select({ c: sql<number>`count(*)` })
          .from(wishlists)
          .where(eq(wishlists.gearId, gearId)),
        db
          .select({ c: sql<number>`count(*)` })
          .from(ownerships)
          .where(eq(ownerships.gearId, gearId)),
      ]);

      return {
        gearId,
        lifetimeViews,
        views30d,
        wishlistTotal: Number(wlRow[0]?.c ?? 0),
        ownershipTotal: Number(ownRow[0]?.c ?? 0),
      };
    },
    key,
    { revalidate: 60 * 60, tags: ["popularity", `gear-stats:${slug}`] },
  );

  return run();
}
