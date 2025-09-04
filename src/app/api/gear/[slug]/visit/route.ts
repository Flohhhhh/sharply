import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { popularityEvents, gear } from "~/server/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";
/**
 * Route: POST /api/gear/[slug]/visit
 * Purpose: Record a 'view' popularity event for a gear item.
 *
 * Behavior overview:
 * - UA denylist: filter obvious bots/crawlers and no-op for them
 * - Visitor identity: signed-in => userId; anonymous => cookie 'visitorId' (UUID)
 * - Dedupe: one view per visitor per gear per UTC calendar day
 * - Append-only: insert into app.popularity_events (no deletions)
 */
// No points; event_type enum values enforced in schema

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    const { slug } = await params;

    // Basic UA denylist to avoid counting obvious bots/crawlers
    const ua = request.headers.get("user-agent") || "";
    const BOT_PATTERNS = [
      /Googlebot/i,
      /Bingbot/i,
      /Slurp/i,
      /DuckDuckBot/i,
      /Baiduspider/i,
      /YandexBot/i,
      /Sogou/i,
      /Exabot/i,
      /facebot/i,
      /ia_archiver/i,
      /Discordbot/i,
      /Slackbot/i,
      /Twitterbot/i,
      /bingpreview/i,
      /crawler/i,
      /spider/i,
      /bot/i,
    ];
    if (BOT_PATTERNS.some((re) => re.test(ua))) {
      console.info("visit blocked", { reason: "bot", slug, ua });
      return NextResponse.json({ success: true, skipped: "bot" });
    }

    const userId = session?.user?.id ?? null;

    // Use a stable cookie for anonymous visitor dedupe (3 day TTL)
    const cookieName = "visitorId";
    let visitorId = request.cookies.get(cookieName)?.value || null;
    let shouldSetCookie = false;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      shouldSetCookie = true;
    }

    // Get gear ID from slug
    const gearResult = await db
      .select({ id: gear.id })
      .from(gear)
      .where(eq(gear.slug, slug))
      .limit(1);

    if (!gearResult.length) {
      console.warn("visit blocked", { reason: "gear_not_found", slug });
      return NextResponse.json({ error: "Gear not found" }, { status: 404 });
    }

    const gearId = gearResult[0]!.id;

    // Compute UTC calendar day window for dedupe: [00:00, 24:00) of today
    const now = new Date();
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

    // Pick identity for dedupe: prefer userId, fallback to visitorId
    const identityFilter = userId
      ? eq(popularityEvents.userId, userId)
      : eq(popularityEvents.visitorId, visitorId);

    // If a view already exists for this gear + identity within today's UTC window, skip insert
    const existing = await db
      .select({ id: popularityEvents.id })
      .from(popularityEvents)
      .where(
        and(
          eq(popularityEvents.gearId, gearId),
          eq(popularityEvents.eventType, "view"),
          gte(popularityEvents.createdAt, startUtc),
          lt(popularityEvents.createdAt, nextUtc),
          identityFilter,
        ),
      )
      .limit(1);

    if (existing.length) {
      console.info("visit blocked", {
        reason: "dedupe",
        slug,
        userId,
        visitorId,
      });
      const res = NextResponse.json({ success: true, deduped: true });
      // If we generated a new visitorId this request, persist it for future dedupe
      if (shouldSetCookie) {
        res.cookies.set(cookieName, visitorId!, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 3, // 3 days
        });
      }
      return res;
    }

    // Record visit as an append-only popularity event
    // - Use userId when present; otherwise include visitorId for anonymous dedupe
    await db.insert(popularityEvents).values({
      gearId,
      userId,
      visitorId: userId ? null : visitorId!,
      eventType: "view",
    });

    const res = NextResponse.json({ success: true, deduped: false });
    // If we generated a new visitorId this request, persist it for future dedupe
    if (shouldSetCookie) {
      res.cookies.set(cookieName, visitorId!, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 3, // 3 days
      });
    }
    return res;
  } catch (error) {
    console.error("Visit tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
