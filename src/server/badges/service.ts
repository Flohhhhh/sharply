import "server-only";
import { BADGE_CATALOG,buildTriggerIndex,validateBadgeCatalog } from "~/lib/badges/catalog";
import type { BadgeDefinition } from "~/types/badges";
import { createNotification } from "~/server/notifications/service";
import type { BadgeEvent } from "~/types/badges";
import { fetchUserById } from "../users/service";
import {
  fetchAnniversaryBackfillCandidates,
  fetchRecentBadgeAwards,
  fetchUserBadgesData,
  getUserSnapshot,
  upsertUserBadge,
} from "./data";

// Boot-time validation of the catalog
validateBadgeCatalog(BADGE_CATALOG);
const TRIGGER_INDEX = buildTriggerIndex(BADGE_CATALOG);
const ANNIVERSARY_BADGE_DEFS = BADGE_CATALOG.filter(
  (def): def is BadgeDefinition & { level: number } =>
    def.family === "anniversary" &&
    typeof def.level === "number" &&
    def.key.startsWith("anniversary_"),
).sort((a, b) => a.level - b.level);

async function awardBadgeDefinition(params: {
  badge: BadgeDefinition;
  eventType: string;
  source: "auto" | "manual";
  userId: string;
  context?: unknown;
  userProfile?: Awaited<ReturnType<typeof fetchUserById>> | null;
}) {
  const { badge, context, eventType, source, userId } = params;
  const inserted = await upsertUserBadge({
    userId,
    badgeKey: badge.key,
    context,
    source,
    eventType,
  });

  if (!inserted) {
    return {
      awarded: false,
      userProfile: params.userProfile ?? null,
    } as const;
  }

  console.log("[badges] awarded", {
    userId,
    badgeKey: badge.key,
    eventType,
  });

  const userProfile = params.userProfile ?? (await fetchUserById(userId));
  const handle = userProfile?.handle || `user-${userProfile?.memberNumber}`;

  await createNotification({
    userId,
    type: "badge_awarded",
    title: `You earned the ${badge.label} badge`,
    body: badge.description,
    linkUrl: `/u/${handle}`,
    sourceType: "badge",
    sourceId: badge.key,
    metadata: { badgeKey: badge.key, eventType },
  });

  return {
    awarded: true,
    userProfile,
  } as const;
}

export async function evaluateForEvent(event: BadgeEvent, userId: string) {
  const snapshot = await getUserSnapshot(userId);
  const defs = TRIGGER_INDEX.get(event.type as any) ?? [];
  const awarded: string[] = [];
  const skipped: string[] = [];
  let userProfile: Awaited<ReturnType<typeof fetchUserById>> | null = null;
  for (const def of defs) {
    if (def.test(snapshot, event.context)) {
      const result = await awardBadgeDefinition({
        badge: def,
        context: event.context,
        eventType: event.type,
        source: "auto",
        userId,
        userProfile,
      });
      userProfile = result.userProfile;
      if (result.awarded) {
        awarded.push(def.key);
      }
    } else {
      skipped.push(def.key);
    }
  }
  return { awarded, skipped } as const;
}

export async function dryRunForEvent(event: BadgeEvent, userId: string) {
  const snapshot = await getUserSnapshot(userId);
  const defs = TRIGGER_INDEX.get(event.type as any) ?? [];
  const passing: string[] = [];
  const failing: string[] = [];
  for (const def of defs) {
    if (def.test(snapshot, event.context)) passing.push(def.key);
    else failing.push(def.key);
  }
  return { passing, failing } as const;
}

export async function fetchRecentAwards(limit = 50) {
  return fetchRecentBadgeAwards(limit);
}

export async function fetchUserBadges(userId: string) {
  return fetchUserBadgesData(userId);
}

export async function runAnniversaryBackfill(params?: {
  dryRun?: boolean;
  limit?: number;
  now?: number;
}) {
  const dryRun = params?.dryRun ?? true;
  const now = params?.now ?? Date.now();
  const { candidates, scannedUsers } = await fetchAnniversaryBackfillCandidates({
    anniversaryBadges: ANNIVERSARY_BADGE_DEFS.map((badge) => ({
      key: badge.key,
      days: badge.level,
    })),
    limit: params?.limit,
    now,
  });

  const sample = candidates.slice(0, 5).map((candidate) => ({
    diffDays: candidate.diffDays,
    joinDate: candidate.joinDate,
    missingBadgeKeys: candidate.missingBadgeKeys,
    userId: candidate.userId,
  }));

  if (dryRun) {
    return {
      dryRun,
      eligibleUsers: candidates.length,
      processedUsers: candidates.length,
      sample,
      scannedUsers,
      totalAwards: candidates.reduce(
        (sum, candidate) => sum + candidate.missingBadgeKeys.length,
        0,
      ),
    } as const;
  }

  let totalAwards = 0;
  for (const candidate of candidates) {
    let userProfile: Awaited<ReturnType<typeof fetchUserById>> | null = null;
    for (const badgeKey of candidate.missingBadgeKeys) {
      const badge = ANNIVERSARY_BADGE_DEFS.find((def) => def.key === badgeKey);
      if (!badge) continue;

      const result = await awardBadgeDefinition({
        badge,
        context: { now, reason: "anniversary_backfill" },
        eventType: "cron.anniversary.backfill",
        source: "auto",
        userId: candidate.userId,
        userProfile,
      });
      userProfile = result.userProfile;
      if (result.awarded) totalAwards++;
    }
  }

  return {
    dryRun,
    eligibleUsers: candidates.length,
    processedUsers: candidates.length,
    sample,
    scannedUsers,
    totalAwards,
  } as const;
}

/**
 * Force-award a badge to a user without running tests.
 * - Idempotent via user_badges PK
 * - Logs to badge_awards_log only if newly inserted
 */
export async function awardBadgeForce(params: {
  userId: string;
  badgeKey: string;
  context?: unknown;
  source?: "auto" | "manual";
  eventType?: string;
}): Promise<{ success: true; awarded: boolean }> {
  const {
    userId,
    badgeKey,
    context,
    source = "manual",
    eventType = "manual",
  } = params;
  const inserted = await upsertUserBadge({
    userId,
    badgeKey,
    context,
    source,
    eventType,
  });
  return { success: true, awarded: inserted } as const;
}
