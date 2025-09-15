import "server-only";

import { db } from "~/server/db";
import { gear } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import {
  hasViewEventForIdentityToday,
  insertViewEvent,
  getTrendingData,
} from "./data";
import { auth } from "~/server/auth";

/**
 * recordGearView(slug, identity)
 *
 * Server-side orchestration for recording a gear view event with dedupe.
 * This function is safe to call from a Server Action. It accepts either
 * a `userId` (for authenticated users) or a `visitorId` (anonymous).
 */
export async function recordGearView(params: {
  slug: string;
  userId?: string | null;
  visitorId?: string | null;
  userAgent?: string | null;
}): Promise<{ success: true; deduped: boolean; skipped?: string }> {
  const ua = params.userAgent || "";
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
    return { success: true, deduped: false, skipped: "bot" } as const;
  }

  const gearRow = await db
    .select({ id: gear.id })
    .from(gear)
    .where(eq(gear.slug, params.slug))
    .limit(1);
  if (!gearRow.length) {
    return { success: true, deduped: false, skipped: "gear_not_found" };
  }
  const gearId = gearRow[0]!.id;

  // Derive userId from server session if not provided by caller
  let resolvedUserId = params.userId ?? null;
  if (!resolvedUserId) {
    try {
      const session = await auth();
      resolvedUserId = session?.user?.id ?? null;
    } catch {}
  }

  const already = await hasViewEventForIdentityToday({
    gearId,
    userId: resolvedUserId,
    visitorId: resolvedUserId ? null : (params.visitorId ?? null),
  });
  if (already) {
    return { success: true, deduped: true } as const;
  }

  await insertViewEvent({
    gearId,
    userId: resolvedUserId,
    visitorId: resolvedUserId ? null : (params.visitorId ?? null),
  });
  return { success: true, deduped: false } as const;
}

export async function fetchTrending(params: {
  timeframe?: "7d" | "30d";
  limit?: number;
  filters?: {
    brandId?: string;
    mountId?: string;
    gearType?: "CAMERA" | "LENS";
  };
}) {
  const timeframe = params.timeframe ?? "30d";
  const limit = params.limit ?? 10;
  const filters = params.filters ?? {};
  return getTrendingData(timeframe, limit, filters);
}
