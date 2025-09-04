import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { gearPopularityWindows, gear, brands } from "~/server/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

// Cache trending results per (timeframe, limit, filters) and tag for manual invalidation
const getTrending = unstable_cache(
  async (
    timeframe: "7d" | "30d",
    limit: number,
    filters: {
      brandId?: string;
      mountId?: string;
      gearType?: "CAMERA" | "LENS";
    },
  ) => {
    const scoreFormula = sql`(
      views_sum * 0.1 +
      wishlist_adds_sum * 2 +
      owner_adds_sum * 3 +
      compare_adds_sum * 1.5 +
      review_submits_sum * 2.5
    )`;

    const baseConds = [
      eq(gearPopularityWindows.timeframe, timeframe as any),
      sql`${gearPopularityWindows.asOfDate} = (
        SELECT MAX(as_of_date)
        FROM app.gear_popularity_windows
        WHERE timeframe = ${timeframe}::popularity_timeframe
      )` as any,
    ];

    if (filters.brandId) baseConds.push(eq(gear.brandId, filters.brandId));
    if (filters.mountId) baseConds.push(eq(gear.mountId, filters.mountId));
    if (filters.gearType)
      baseConds.push(eq(gear.gearType, filters.gearType as any));

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
      .where(and(...(baseConds as any)))
      .orderBy(desc(scoreFormula))
      .limit(limit);

    return rows.map((item) => ({
      gearId: item.gearId,
      slug: item.slug,
      name: item.name,
      gearType: item.gearType,
      brandName: item.brandName,
      score: Number(item.score),
      stats: {
        views: item.viewsSum,
        wishlistAdds: item.wishlistAddsSum,
        ownerAdds: item.ownerAddsSum,
        compareAdds: item.compareAddsSum,
        reviewSubmits: item.reviewSubmitsSum,
      },
      asOfDate: item.asOfDate,
    }));
  },
  ["trending"],
  { revalidate: 60 * 60 * 12, tags: ["trending"] },
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframeParam = searchParams.get("timeframe") || "30d";
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const brandId = searchParams.get("brandId") || undefined;
    const mountId = searchParams.get("mountId") || undefined;
    const gearTypeParam = searchParams.get("gearType") || undefined;

    if (timeframeParam !== "7d" && timeframeParam !== "30d") {
      return NextResponse.json(
        { error: "timeframe must be '7d' or '30d'" },
        { status: 400 },
      );
    }
    const timeframe = timeframeParam as "7d" | "30d";

    let gearType: "CAMERA" | "LENS" | undefined = undefined;
    if (gearTypeParam) {
      if (gearTypeParam !== "CAMERA" && gearTypeParam !== "LENS") {
        return NextResponse.json(
          { error: "gearType must be 'CAMERA' or 'LENS'" },
          { status: 400 },
        );
      }
      gearType = gearTypeParam as "CAMERA" | "LENS";
    }

    const items = await getTrending(timeframe, limit, {
      brandId,
      mountId,
      gearType,
    });

    return NextResponse.json({
      timeframe,
      limit,
      brandId,
      mountId,
      gearType,
      items,
    });
  } catch (error) {
    console.error("Trending items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
