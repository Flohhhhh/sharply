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
  popularityEvents,
} from "~/server/db/schema";
import { and, desc, eq, gte, lt, sql, type SQL } from "drizzle-orm";

/**
 * Popularity data access layer (server-only)
 *
 * Purpose:
 * - Provide a single source of truth for popularity reads used by server components
 * - Centralize caching policy (revalidate windows, tag invalidation) with `unstable_cache`
 * - Avoid HTTP round-trips to our own API during SSG/ISR (prevents build-time failures)
 *
 * Design:
 * - Expose small, composable functions that return ready-to-render shapes
 * - Keep queries transparent and documented; prefer straightforward SQL aggregation
 * - Match tag names used by rollup revalidation (e.g., 'trending')
 */

/**
 * Optional filters used to scope trending results.
 * - brandId: restrict to a specific brand
 * - mountId: restrict to a specific mount (if populated on gear)
 * - gearType: camera or lens
 */
export type TrendingFilters = {
  brandId?: string;
  mountId?: string;
  gearType?: "CAMERA" | "LENS";
};

/**
 * getTrendingData(timeframe, limit, filters)
 *
 * Returns top-N trending gear for the given window.
 *
 * Caching:
 * - Cached for 12h via `unstable_cache`
 * - Tagged with 'trending' so a rollup can revalidate proactively
 * - Cache key includes timeframe, limit, and filters to avoid collisions
 *
 * Query notes:
 * - We compute a weighted composite score over window columns
 * - We always select the most recent `as_of_date` for the timeframe
 * - Optional filters apply at the gear row (brand/mount/type)
 */
export async function getTrendingData(
  timeframe: "7d" | "30d",
  limit: number,
  filters: TrendingFilters = {},
) {
  // Stable cache key across inputs (kept small and deterministic)
  const key = [
    "pop-trending",
    timeframe,
    String(limit),
    filters.brandId ?? "-",
    filters.mountId ?? "-",
    filters.gearType ?? "-",
  ];

  // Wrap the resolver with unstable_cache to enable ISR-style caching and tag invalidation
  const run = unstable_cache(
    async () => {
      // Composite score: simple, transparent weights; typed numeric expression
      const scoreFormula = sql<number>`(
        views_sum * 0.1 +
        wishlist_adds_sum * 2 +
        owner_adds_sum * 3 +
        compare_adds_sum * 1.5 +
        review_submits_sum * 2.5
      )`;

      // Base conditions: fixed timeframe and only the most recent snapshot for that timeframe
      const conditions: SQL[] = [
        eq(gearPopularityWindows.timeframe, timeframe),
        sql`${gearPopularityWindows.asOfDate} = (
          SELECT MAX(as_of_date)
          FROM app.gear_popularity_windows
          WHERE timeframe = ${timeframe}::popularity_timeframe
        )`,
      ];
      // Optional scoping filters
      if (filters.brandId) conditions.push(eq(gear.brandId, filters.brandId));
      if (filters.mountId) conditions.push(eq(gear.mountId, filters.mountId));
      if (filters.gearType)
        conditions.push(eq(gear.gearType, filters.gearType));

      // Read a single row per gear for the latest snapshot; order by score desc; limit N
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
        .where(and(...conditions))
        .orderBy(desc(scoreFormula))
        .limit(limit);

      // Map to a render-ready shape
      return rows.map((r) => ({
        gearId: r.gearId,
        slug: r.slug,
        name: r.name,
        brandName: r.brandName,
        gearType: r.gearType,
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

/**
 * getGearStats(slug)
 *
 * Returns aggregated stats for a gear slug:
 * - lifetimeViews (from lifetime table)
 * - views30d (from window snapshot; falls back to summing daily if missing)
 * - wishlistTotal and ownershipTotal (from truth tables)
 *
 * Caching:
 * - Cached for 1h via `unstable_cache`
 * - Tagged with 'popularity' and a gear-specific tag for partial invalidation
 *
 * Query notes:
 * - We resolve the gear id by slug to avoid exposing ids at the call site
 * - We read the latest 30d snapshot; if missing (e.g., right after bootstrap), we sum daily rows
 * - Truth counts stay authoritative for current totals
 */
export async function getGearStats(slug: string) {
  const key = ["gear-stats", slug];
  const run = unstable_cache(
    async () => {
      // Resolve gear id from slug (keeps call-sites simple and stable)
      const gearRow = await db
        .select({ id: gear.id })
        .from(gear)
        .where(eq(gear.slug, slug))
        .limit(1);
      if (!gearRow.length) {
        // Keep return type stable; callers can render zeros or hide blocks
        return {
          gearId: "",
          lifetimeViews: 0,
          views30d: 0,
          wishlistTotal: 0,
          ownershipTotal: 0,
        };
      }
      const gearId = gearRow[0]!.id;

      // Lifetime totals: monotonic sums for fast reads
      const lifetimeRow = await db
        .select({ v: gearPopularityLifetime.viewsLifetime })
        .from(gearPopularityLifetime)
        .where(eq(gearPopularityLifetime.gearId, gearId))
        .limit(1);
      const lifetimeViews = Number(lifetimeRow[0]?.v ?? 0);

      // 30d views: prefer the cached window snapshot at the latest as_of_date
      const win30Row = await db
        .select({
          v: gearPopularityWindows.viewsSum,
          d: gearPopularityWindows.asOfDate,
        })
        .from(gearPopularityWindows)
        .where(
          and(
            eq(gearPopularityWindows.gearId, gearId),
            eq(gearPopularityWindows.timeframe, "30d"),
          ),
        )
        .orderBy(desc(gearPopularityWindows.asOfDate))
        .limit(1);
      let views30d = Number(win30Row[0]?.v ?? 0);

      // Fallback: if no window snapshot exists yet, sum from daily (bounded window)
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

      // Truth counts: authoritative for "now"
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

/**
 * hasViewEventForIdentityToday
 *
 * Checks if a 'view' event exists for the given gear and identity (user or visitor)
 * within the current UTC calendar day.
 */
export async function hasViewEventForIdentityToday(params: {
  gearId: string;
  userId?: string | null;
  visitorId?: string | null;
  now?: Date;
}): Promise<boolean> {
  const now = params.now ?? new Date();
  const startUtc = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const nextUtc = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );

  const identityFilter = params.userId
    ? eq(popularityEvents.userId, params.userId)
    : eq(popularityEvents.visitorId, params.visitorId!);

  const existing = await db
    .select({ id: popularityEvents.id })
    .from(popularityEvents)
    .where(
      and(
        eq(popularityEvents.gearId, params.gearId),
        eq(popularityEvents.eventType, "view"),
        gte(popularityEvents.createdAt, startUtc),
        lt(popularityEvents.createdAt, nextUtc),
        identityFilter,
      ),
    )
    .limit(1);

  return existing.length > 0;
}

/**
 * insertViewEvent
 *
 * Appends a 'view' popularity event. When a userId is present, visitorId is ignored.
 */
export async function insertViewEvent(params: {
  gearId: string;
  userId?: string | null;
  visitorId?: string | null;
}) {
  await db.insert(popularityEvents).values({
    gearId: params.gearId,
    userId: params.userId ?? null,
    visitorId: params.userId ? null : (params.visitorId ?? null),
    eventType: "view",
  });
}
