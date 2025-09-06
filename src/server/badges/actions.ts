"use server";
import "server-only";
import { dryRunForEvent, evaluateForEvent, awardBadgeForce } from "./service";
import type { BadgeEvent } from "~/types/badges";

export async function actionDryRunBadges(userId: string, event: BadgeEvent) {
  return dryRunForEvent(event, userId);
}

export async function actionEvaluateBadges(userId: string, event: BadgeEvent) {
  return evaluateForEvent(event, userId);
}

export async function actionAwardBadgeForce(
  userId: string,
  badgeKey: string,
  context?: unknown,
) {
  return awardBadgeForce({
    userId,
    badgeKey,
    context,
    source: "manual",
    eventType: "manual",
  });
}
