import "server-only";
import { BADGE_CATALOG, validateBadgeCatalog } from "~/lib/badges/catalog";
import {
  getUserSnapshot,
  upsertUserBadge,
  fetchRecentBadgeAwards,
} from "./data";
import { fetchUserBadgesData } from "./data";
import type { BadgeEvent } from "~/types/badges";
import { buildTriggerIndex } from "~/lib/badges/catalog";
import { createNotification } from "~/server/notifications/service";
import { fetchUserById } from "../users/service";

// Boot-time validation of the catalog
validateBadgeCatalog(BADGE_CATALOG);
const TRIGGER_INDEX = buildTriggerIndex(BADGE_CATALOG);

export async function evaluateForEvent(event: BadgeEvent, userId: string) {
  const snapshot = await getUserSnapshot(userId);
  const defs = TRIGGER_INDEX.get(event.type as any) ?? [];
  const awarded: string[] = [];
  const skipped: string[] = [];
  for (const def of defs) {
    if (def.test(snapshot, event.context)) {
      const inserted = await upsertUserBadge({
        userId,
        badgeKey: def.key,
        context: event.context,
        source: "auto",
        eventType: event.type,
      });
      if (inserted) {
        console.log("[badges] awarded", {
          userId,
          badgeKey: def.key,
          eventType: event.type,
        });
        awarded.push(def.key);

        const user = await fetchUserById(userId);
        const handle = user?.handle || `user-${user?.memberNumber}`;

        await createNotification({
          userId,
          type: "badge_awarded",
          title: `You earned the ${def.label} badge`,
          body: def.description,
          linkUrl: `/u/${handle}`,
          sourceType: "badge",
          sourceId: def.key,
          metadata: { badgeKey: def.key, eventType: event.type },
        });
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
