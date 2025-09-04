import { sql, and, eq, gte, lt } from "drizzle-orm";
import { db } from "~/server/db";
import { popularityEvents } from "~/server/db/schema";

export async function hasEventForUserOnUtcDay(params: {
  gearId: string;
  userId: string;
  eventType:
    | "view"
    | "wishlist_add"
    | "owner_add"
    | "compare_add"
    | "review_submit"
    | "api_fetch";
  date?: Date; // defaults to now (UTC day)
}): Promise<boolean> {
  const now = params.date ?? new Date();
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

  const existing = await db
    .select({ id: popularityEvents.id })
    .from(popularityEvents)
    .where(
      and(
        eq(popularityEvents.gearId, params.gearId),
        eq(popularityEvents.userId, params.userId),
        eq(popularityEvents.eventType, params.eventType),
        gte(popularityEvents.createdAt, startUtc),
        lt(popularityEvents.createdAt, nextUtc),
      ),
    )
    .limit(1);

  return existing.length > 0;
}
