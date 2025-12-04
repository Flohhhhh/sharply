import "server-only";

import { db } from "~/server/db";
import { gear } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import {
  hasViewEventForIdentityToday,
  insertViewEvent,
  getTrendingData,
  getTrendingTotalCount,
  getLiveTrendingOverlay,
  hasEventForIdentityToday as hasEventForIdentityTodayGeneric,
  insertCompareAddEvent,
  incrementComparePairCountBySlugs,
  fetchTopComparePairs as fetchTopComparePairsData,
} from "./data";
import { mergeTrendingWithLiveOverlay } from "./live";
export { mergeTrendingWithLiveOverlay } from "./live";
import { auth } from "~/server/auth";
import type {
  TrendingFiltersInput,
  TrendingPageResult,
  TrendingEntry,
  TrendingEntryWithLive,
  LiveTrendingOverlay,
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
  return getTrendingData(timeframe, limit, filters, offset);
}

export async function fetchTrendingWithLive(params: {
  timeframe?: "7d" | "30d";
  limit?: number;
  filters?: TrendingFiltersInput;
}) {
  const timeframe = params.timeframe ?? "30d";
  const limit = params.limit ?? 10;
  const filters = params.filters ?? {};

  const [baseline, liveOverlay] = await Promise.all([
    getTrendingData(timeframe, limit, filters, 0),
    getLiveTrendingOverlay(limit, filters, 0),
  ]);

  return {
    items: mergeTrendingWithLiveOverlay({
      baseline,
      liveOverlay,
      limit,
    }),
    liveOverlay,
  };
}

export async function fetchLiveTrendingOverlay(params: {
  limit?: number;
  offset?: number;
  filters?: TrendingFiltersInput;
}) {
  const limit = params.limit ?? 10;
  const filters = params.filters ?? {};
  const offset = params.offset ?? 0;
  return getLiveTrendingOverlay(limit, filters, offset);
}

export async function fetchTrendingPage(params: {
  timeframe?: "7d" | "30d";
  page?: number;
  perPage?: number;
  filters?: TrendingFiltersInput;
  includeLiveOverlay?: boolean;
}): Promise<TrendingPageResult> {
  const timeframe = params.timeframe ?? "30d";
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(50, Math.max(5, params.perPage ?? 10));
  const filters = params.filters ?? {};
  const offset = (page - 1) * perPage;

  const [items, total, liveOverlay] = await Promise.all([
    getTrendingData(timeframe, perPage, filters, offset),
    getTrendingTotalCount(timeframe, filters),
    params.includeLiveOverlay
      ? getLiveTrendingOverlay(perPage, filters, offset)
      : Promise.resolve<LiveTrendingOverlay | null>(null),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    timeframe,
    filters,
    liveOverlay,
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

  let resolvedUserId = params.userId ?? null;
  if (!resolvedUserId) {
    try {
      const session = await auth();
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
