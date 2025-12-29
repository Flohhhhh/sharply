import "server-only";
import { db } from "~/server/db";
import {
  users,
  reviews,
  gearEdits,
  wishlists,
  ownerships,
  userBadges,
  badgeAwardsLog,
} from "~/server/db/schema";
import { and, count, eq, desc } from "drizzle-orm";
import type { UserSnapshot } from "~/types/badges";

export async function getUserSnapshot(userId: string): Promise<UserSnapshot> {
  const [[userRow], [reviewsAgg], [editsAgg], [wishAgg], [ownAgg]] =
    await Promise.all([
      db
        .select({
          joinDate: users.createdAt, // fallback if separate join date not present
        })
        .from(users)
        .where(eq(users.id, userId)),
      db
        .select({ approvedReviews: count() })
        .from(reviews)
        .where(
          and(
            eq(reviews.createdById, userId),
            eq(reviews.status, "APPROVED" as const),
          ),
        ),
      db
        .select({ approvedEdits: count() })
        .from(gearEdits)
        .where(
          and(
            eq(gearEdits.createdById, userId),
            eq(gearEdits.status, "APPROVED" as const),
          ),
        ),
      db
        .select({ wishlistCount: count() })
        .from(wishlists)
        .where(eq(wishlists.userId, userId)),
      db
        .select({ ownershipCount: count() })
        .from(ownerships)
        .where(eq(ownerships.userId, userId)),
    ]);

  return {
    approvedEdits: Number(editsAgg?.approvedEdits ?? 0),
    approvedReviews: Number(reviewsAgg?.approvedReviews ?? 0),
    wishlistCount: Number(wishAgg?.wishlistCount ?? 0),
    ownershipCount: Number(ownAgg?.ownershipCount ?? 0),
    joinDate: (userRow?.joinDate as Date | null) ?? null,
  };
}

export async function upsertUserBadge(params: {
  userId: string;
  badgeKey: string;
  context?: unknown;
  source?: "auto" | "manual";
  eventType?: string;
}): Promise<boolean> {
  const {
    userId,
    badgeKey,
    context,
    source = "auto",
    eventType = "unknown",
  } = params;
  // Drizzle lacks native upsert for composite PK without conflict target; emulate with try/insert-ignore
  const inserted = await db
    .insert(userBadges)
    .values({ userId, badgeKey, context: context as any, source })
    .onConflictDoNothing()
    .returning({ userId: userBadges.userId });

  const didInsert = inserted.length > 0;
  if (didInsert) {
    // Append audit log only when newly awarded
    await db.insert(badgeAwardsLog).values({
      userId,
      badgeKey,
      context: context as any,
      source,
      eventType,
    });
  }
  return didInsert;
}

export async function fetchRecentBadgeAwards(limit = 50) {
  const rows = await db
    .select({
      id: badgeAwardsLog.id,
      userId: badgeAwardsLog.userId,
      badgeKey: badgeAwardsLog.badgeKey,
      eventType: badgeAwardsLog.eventType,
      source: badgeAwardsLog.source,
      awardedAt: badgeAwardsLog.awardedAt,
    })
    .from(badgeAwardsLog)
    .orderBy(desc(badgeAwardsLog.awardedAt))
    .limit(limit);
  return rows;
}

export async function fetchUserBadgesData(userId: string) {
  const rows = await db
    .select({
      badgeKey: userBadges.badgeKey,
      awardedAt: userBadges.awardedAt,
      sortOverride: userBadges.sortOverride,
    })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
  return rows;
}
