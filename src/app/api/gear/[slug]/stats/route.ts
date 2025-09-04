import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import {
  gear,
  gearPopularityLifetime,
  gearPopularityWindows,
  gearPopularityDaily,
  wishlists,
  ownerships,
} from "~/server/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Resolve gear ID
    const gearRow = await db
      .select({ id: gear.id })
      .from(gear)
      .where(eq(gear.slug, slug))
      .limit(1);

    if (!gearRow.length) {
      return NextResponse.json({ error: "Gear not found" }, { status: 404 });
    }

    const gearId = gearRow[0]!.id;

    // Lifetime views (fallback to 0)
    const lifetimeRow = await db
      .select({ v: gearPopularityLifetime.viewsLifetime })
      .from(gearPopularityLifetime)
      .where(eq(gearPopularityLifetime.gearId, gearId))
      .limit(1);
    const lifetimeViews = Number(lifetimeRow[0]?.v ?? 0);

    // 30d views from windows (latest snapshot); fallback to 0
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

    // Current totals from truth tables
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

    const wishlistTotal = Number(wlRow[0]?.c ?? 0);
    const ownershipTotal = Number(ownRow[0]?.c ?? 0);

    return NextResponse.json({
      gearId,
      lifetimeViews,
      views30d,
      wishlistTotal,
      ownershipTotal,
    });
  } catch (error) {
    console.error("Gear stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
