import "server-only";

import { db } from "~/server/db";
import { gear } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import {
  hasViewEventForIdentityToday,
  insertViewEvent,
  getTrendingData,
  getTrendingTotalCount,
  getLiveTrendingSnapshot,
  hasEventForIdentityToday as hasEventForIdentityTodayGeneric,
  insertCompareAddEvent,
  incrementComparePairCountBySlugs,
  fetchTopComparePairs as fetchTopComparePairsData,
} from "./data";
import { applyLiveBoostToTrending } from "./live";
export { applyLiveBoostToTrending } from "./live";
import { auth } from "~/auth";
import { headers } from "next/headers";
import type {
  TrendingFiltersInput,
  TrendingPageResult,
  TrendingEntry,
} from "~/types/popularity";

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
      const session = await auth.api.getSession({
        headers: await headers(),
      });
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

/**
 * incrementComparePairCount(slugs)
 *
 * Minimal per-pair counter with atomic upsert. Slugs are sorted in the data layer.
 */
export async function incrementComparePairCount(params: {
  slugs: [string, string];
}): Promise<{ success: boolean; skipped?: string }> {
  return incrementComparePairCountBySlugs({ slugs: params.slugs });
}

export async function fetchTopComparePairs(limit = 20) {
  return fetchTopComparePairsData(limit);
}

export async function fetchLiveBoosts(params?: {
  limit?: number;
  filters?: TrendingFiltersInput;
  offset?: number;
}) {
  const limit = params?.limit ?? 50;
  const filters = params?.filters ?? {};
  const offset = params?.offset ?? 0;
  const snapshot = await getLiveTrendingSnapshot(limit, filters, offset);
  // Only show items with a positive live score
  return snapshot.items.filter((i) => (i.liveScore ?? 0) > 0);
}

export async function fetchTrending(params: {
  timeframe?: "7d" | "30d";
  limit?: number;
  offset?: number;
  filters?: TrendingFiltersInput;
}) {
  const timeframe = params.timeframe ?? "30d";
  const limit = params.limit ?? 10;
  const filters = params.filters ?? {};
  const offset = params.offset ?? 0;

  const [baseline, liveSnapshot] = await Promise.all([
    getTrendingData(timeframe, limit, filters, offset),
    getLiveTrendingSnapshot(limit, filters, offset),
  ]);

  return applyLiveBoostToTrending({ baseline, liveSnapshot, limit });
}

export async function fetchTrendingPage(params: {
  timeframe?: "7d" | "30d";
  page?: number;
  perPage?: number;
  filters?: TrendingFiltersInput;
}): Promise<TrendingPageResult> {
  const timeframe = params.timeframe ?? "30d";
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(50, Math.max(5, params.perPage ?? 10));
  const filters = params.filters ?? {};
  const offset = (page - 1) * perPage;

  const [baseline, total, liveSnapshot] = await Promise.all([
    getTrendingData(timeframe, perPage, filters, offset),
    getTrendingTotalCount(timeframe, filters),
    getLiveTrendingSnapshot(perPage, filters, offset),
  ]);

  return {
    items: applyLiveBoostToTrending({
      baseline,
      liveSnapshot,
      limit: perPage,
    }),
    total,
    page,
    perPage,
    timeframe,
    filters,
  };
}

/**
 * recordCompareAdd(slug, identity)
 *
 * Appends a `compare_add` popularity event for this gear if not already
 * recorded for the current identity (user or visitor) today.
 */
export async function recordCompareAdd(params: {
  slug: string;
  userId?: string | null;
  visitorId?: string | null;
}): Promise<{ success: true; deduped: boolean; skipped?: string }> {
  const gearRow = await db
    .select({ id: gear.id })
    .from(gear)
    .where(eq(gear.slug, params.slug))
    .limit(1);
  if (!gearRow.length) {
    return { success: true, deduped: false, skipped: "gear_not_found" };
  }
  const gearId = gearRow[0]!.id;

  // try to get userId from session to assign to the event
  let resolvedUserId = params.userId ?? null;
  if (!resolvedUserId) {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      resolvedUserId = session?.user?.id ?? null;
    } catch {}
  }

  const already = await hasEventForIdentityTodayGeneric({
    gearId,
    eventType: "compare_add",
    userId: resolvedUserId ?? undefined,
    visitorId: resolvedUserId ? null : (params.visitorId ?? null),
  });
  if (already) return { success: true, deduped: true } as const;

  await insertCompareAddEvent({
    gearId,
    userId: resolvedUserId,
    visitorId: resolvedUserId ? null : (params.visitorId ?? null),
  });
  return { success: true, deduped: false } as const;
}
