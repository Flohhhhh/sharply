import { and,asc,count,desc,eq,inArray,lte } from "drizzle-orm";
import "server-only";
import { db } from "~/server/db";
import {
  badgeAwardsLog,
  gearEdits,
  ownerships,
  reviews,
  userBadges,
  users,
  wishlists,
} from "~/server/db/schema";
import type { UserSnapshot } from "~/types/badges";

const DAY_IN_MS = 86400000;

export type AnniversaryBadgeThreshold = {
  days: number;
  key: string;
};

export type AnniversaryBackfillCandidate = {
  diffDays: number;
  joinDate: Date;
  missingBadgeKeys: string[];
  userId: string;
};

type AnniversaryBackfillUser = {
  createdAt: Date | null;
  existingBadgeKeys: string[];
  id: string;
};

export function buildAnniversaryBackfillCandidates(params: {
  anniversaryBadges: AnniversaryBadgeThreshold[];
  limit?: number;
  now: number;
  users: AnniversaryBackfillUser[];
}): AnniversaryBackfillCandidate[] {
  const { anniversaryBadges, limit, now, users } = params;
  if (typeof limit === "number" && limit <= 0) return [];
  const sortedBadges = [...anniversaryBadges].sort((a, b) => a.days - b.days);
  const firstThreshold = sortedBadges[0]?.days;

  if (!firstThreshold) return [];

  const candidates: AnniversaryBackfillCandidate[] = [];
  for (const user of users) {
    const joinMs =
      user.createdAt instanceof Date ? user.createdAt.getTime() : Number.NaN;
    if (!Number.isFinite(joinMs)) continue;

    const diffDays = Math.floor((now - joinMs) / DAY_IN_MS);
    if (diffDays < firstThreshold) continue;

    const existingBadgeKeys = new Set(
      user.existingBadgeKeys.filter((key) => key.startsWith("anniversary_")),
    );
    const missingBadgeKeys = sortedBadges
      .filter((badge) => diffDays >= badge.days && !existingBadgeKeys.has(badge.key))
      .map((badge) => badge.key);

    if (missingBadgeKeys.length === 0) continue;

    candidates.push({
      userId: user.id,
      joinDate: new Date(joinMs),
      diffDays,
      missingBadgeKeys,
    });

    if (typeof limit === "number" && candidates.length >= limit) break;
  }

  return candidates;
}

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

export async function fetchAnniversaryBackfillCandidates(params: {
  anniversaryBadges: AnniversaryBadgeThreshold[];
  limit?: number;
  now: number;
}) {
  const { anniversaryBadges, limit, now } = params;
  const firstThreshold = anniversaryBadges.reduce<number | null>(
    (smallest, badge) =>
      smallest === null || badge.days < smallest ? badge.days : smallest,
    null,
  );

  if (firstThreshold === null) {
    return {
      candidates: [] as AnniversaryBackfillCandidate[],
      scannedUsers: 0,
    };
  }

  const oldestEligibleJoinDate = new Date(now - firstThreshold * DAY_IN_MS);
  const candidateUsers = await db
    .select({
      createdAt: users.createdAt,
      id: users.id,
    })
    .from(users)
    .where(lte(users.createdAt, oldestEligibleJoinDate))
    .orderBy(asc(users.createdAt), asc(users.id));

  if (candidateUsers.length === 0) {
    return {
      candidates: [] as AnniversaryBackfillCandidate[],
      scannedUsers: 0,
    };
  }

  const anniversaryKeys = anniversaryBadges.map((badge) => badge.key);
  const existingBadgeRows = await db
    .select({
      badgeKey: userBadges.badgeKey,
      userId: userBadges.userId,
    })
    .from(userBadges)
    .where(
      and(
        inArray(
          userBadges.userId,
          candidateUsers.map((user) => user.id),
        ),
        inArray(userBadges.badgeKey, anniversaryKeys),
      ),
    );

  const existingBadgeKeysByUserId = new Map<string, string[]>();
  for (const row of existingBadgeRows) {
    const keys = existingBadgeKeysByUserId.get(row.userId) ?? [];
    keys.push(row.badgeKey);
    existingBadgeKeysByUserId.set(row.userId, keys);
  }

  return {
    scannedUsers: candidateUsers.length,
    candidates: buildAnniversaryBackfillCandidates({
      anniversaryBadges,
      limit,
      now,
      users: candidateUsers.map((user) => ({
        id: user.id,
        createdAt: user.createdAt,
        existingBadgeKeys: existingBadgeKeysByUserId.get(user.id) ?? [],
      })),
    }),
  };
}
