import "server-only";

import { count,eq,inArray } from "drizzle-orm";

import { db } from "~/server/db";
import { gear,gearEdits,reviews,users } from "~/server/db/schema";

export type DiscordBotPriceRow = {
  msrpNowUsdCents: number | null;
  msrpAtLaunchUsdCents: number | null;
  mpbMaxPriceUsdCents: number | null;
};

export async function fetchDiscordBotGearPricesBySlug(
  slug: string,
): Promise<DiscordBotPriceRow | null> {
  const rows = await db
    .select({
      msrpNowUsdCents: gear.msrpNowUsdCents,
      msrpAtLaunchUsdCents: gear.msrpAtLaunchUsdCents,
      mpbMaxPriceUsdCents: gear.mpbMaxPriceUsdCents,
    })
    .from(gear)
    .where(eq(gear.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

export type DiscordBotLeaderboardRow = {
  name: string;
  score: number;
  reviews: number;
  edits: number;
};

export async function fetchDiscordBotLeaderboardRows(
  limit = 10,
): Promise<DiscordBotLeaderboardRow[]> {
  const [reviewsByUser, editsByUser] = await Promise.all([
    db
      .select({ userId: reviews.createdById, c: count() })
      .from(reviews)
      .groupBy(reviews.createdById),
    db
      .select({ userId: gearEdits.createdById, c: count() })
      .from(gearEdits)
      .groupBy(gearEdits.createdById),
  ]);

  const userIds = new Set<string>();
  for (const row of reviewsByUser) {
    if (row.userId) userIds.add(row.userId);
  }
  for (const row of editsByUser) {
    if (row.userId) userIds.add(row.userId);
  }

  const ids = Array.from(userIds);
  const userRows = ids.length
    ? await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, ids))
    : [];

  const idToName = new Map(userRows.map((row) => [row.id, row.name]));
  const reviewMap = new Map(
    reviewsByUser.map((row) => [row.userId, Number(row.c ?? 0)]),
  );
  const editMap = new Map(
    editsByUser.map((row) => [row.userId, Number(row.c ?? 0)]),
  );

  return ids
    .map((id) => {
      const reviewsCount = reviewMap.get(id) ?? 0;
      const editsCount = editMap.get(id) ?? 0;
      return {
        name: idToName.get(id) ?? "(anonymous)",
        score: reviewsCount + editsCount,
        reviews: reviewsCount,
        edits: editsCount,
      } satisfies DiscordBotLeaderboardRow;
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
}
