import "server-only";

import { buildCompareHref } from "~/lib/utils/url";
import { fetchContributionCount, fetchGearCount } from "~/server/metrics/service";
import { fetchTrending } from "~/server/popularity/service";
import { searchGear, type SearchResult } from "~/server/search/service";
import { resolveGearFromMessage } from "~/server/discord-bot/service";

import {
  fetchDiscordBotGearPricesBySlug,
  fetchDiscordBotLeaderboardRows,
} from "./data";

export type DiscordBotResolvedGear = Pick<
  SearchResult,
  "id" | "name" | "slug" | "brandName"
> & {
  url: string;
};

function buildGearUrl(slug: string) {
  return `${process.env.NEXT_PUBLIC_BASE_URL}/gear/${slug}`;
}

function toResolvedGear(item: SearchResult): DiscordBotResolvedGear {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    brandName: item.brandName,
    url: buildGearUrl(item.slug),
  };
}

export async function searchTopGearForDiscord(query: string) {
  const result = await searchGear({
    query,
    sort: "relevance",
    page: 1,
    pageSize: 1,
    includeTotal: false,
  });

  const topResult = result.results[0];
  if (!topResult) return null;

  return toResolvedGear(topResult);
}

export async function getDiscordGearPriceSummary(query: string) {
  const item = await searchTopGearForDiscord(query);
  if (!item) return null;

  const prices = await fetchDiscordBotGearPricesBySlug(item.slug);
  return {
    item,
    prices: prices ?? {
      msrpNowUsdCents: null,
      msrpAtLaunchUsdCents: null,
      mpbMaxPriceUsdCents: null,
    },
  };
}

export async function resolveDiscordCompare(
  firstQuery: string,
  secondQuery: string,
) {
  const [first, second] = await Promise.all([
    searchTopGearForDiscord(firstQuery),
    searchTopGearForDiscord(secondQuery),
  ]);

  if (!first || !second) {
    return {
      first,
      second,
      compareUrl: null,
    };
  }

  return {
    first,
    second,
    compareUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${buildCompareHref([
      first.slug,
      second.slug,
    ])}`,
  };
}

export async function getDiscordTotals() {
  const [gearCount, contributionCount] = await Promise.all([
    fetchGearCount(),
    fetchContributionCount(),
  ]);

  return {
    gearCount,
    contributionCount,
  };
}

export async function getDiscordLeaderboard(limit = 10) {
  return fetchDiscordBotLeaderboardRows(limit);
}

export async function getDiscordTrending(window: "7d" | "30d", limit = 10) {
  const items = await fetchTrending({
    timeframe: window,
    limit,
  });

  return items.map((item) => ({
    gearId: item.gearId,
    name: item.name,
    brandName: item.brandName,
    slug: item.slug,
    url: buildGearUrl(item.slug),
  }));
}

export async function resolveDiscordMessageSearch(message: string) {
  const resolved = await resolveGearFromMessage(message, {
    maxQueries: 6,
  });

  if (!resolved.ok) {
    return resolved;
  }

  return {
    ...resolved,
    item: {
      ...toResolvedGear(resolved.item),
    },
  };
}
