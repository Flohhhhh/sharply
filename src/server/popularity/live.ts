import type {
  LiveTrendingOverlay,
  TrendingEntry,
  TrendingEntryWithLive,
} from "~/types/popularity";

export function mergeTrendingWithLiveOverlay(params: {
  baseline: TrendingEntry[];
  liveOverlay?: LiveTrendingOverlay | null;
  limit?: number;
}): TrendingEntryWithLive[] {
  const liveItems = params.liveOverlay?.items ?? [];
  const liveMap = new Map<string, (typeof liveItems)[number]>();
  for (const item of liveItems) {
    liveMap.set(item.gearId, item);
  }
  const baselineIds = new Set(params.baseline.map((item) => item.gearId));

  const merged: TrendingEntryWithLive[] = params.baseline.map((item) => {
    const live = liveMap.get(item.gearId);
    const liveScore = live?.liveScoreDelta ?? 0;
    return {
      ...item,
      combinedScore: item.score + liveScore,
      liveScore,
      liveStats: live?.stats,
      liveOnly: false,
    };
  });

  for (const live of liveItems) {
    if (baselineIds.has(live.gearId)) continue;
    merged.push({
      ...live,
      score: live.liveScoreDelta,
      combinedScore: live.liveScoreDelta,
      liveScore: live.liveScoreDelta,
      liveStats: live.stats,
      liveOnly: true,
    });
  }

  merged.sort((a, b) => {
    if (b.combinedScore !== a.combinedScore) {
      return b.combinedScore - a.combinedScore;
    }
    return b.score - a.score;
  });

  const limit = params.limit ?? merged.length;
  return merged.slice(0, limit);
}


