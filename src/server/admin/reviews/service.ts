import "server-only";

import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import { headers } from "next/headers";
import {
  approveReviewById,
  rejectReviewById,
  listAllReviewsWithContext,
  getReviewUserAndGear,
  listOpenReviewFlagStats,
  resolveOpenFlagsForReview,
} from "./data";
import { evaluateForEvent } from "~/server/badges/service";
import { maybeGenerateReviewSummary } from "~/server/reviews/summary/service";
import { db } from "~/server/db";
import { gear as gearTable } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function fetchAdminReviews() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const user = session?.user;
  if (!requireRole(user, ["MODERATOR"]))
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  const [reviews, flagStats] = await Promise.all([
    listAllReviewsWithContext(),
    listOpenReviewFlagStats(),
  ]);

  const flagStatsByReviewId = new Map(
    flagStats.map((item) => [item.reviewId, item]),
  );

  return reviews.map((review) => {
    const stat = flagStatsByReviewId.get(review.id);
    return {
      ...review,
      openFlagsCount: Number(stat?.openFlagsCount ?? 0),
      latestFlagAt: stat?.latestFlagAt ?? null,
    };
  });
}

export async function approveReview(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const user = session?.user;
  if (!requireRole(user, ["MODERATOR"]))
    throw Object.assign(new Error("Unauthorized"), { status: 401 });

  const ctx = await getReviewUserAndGear(id);
  await approveReviewById(id);
  if (ctx?.userId) {
    await evaluateForEvent(
      { type: "review.approved", context: { gearId: ctx.gearId } },
      ctx.userId,
    );
  }

  // Fire-and-forget summary generation; don't block admin UX on LLM
  if (ctx?.gearId) {
    const rows = await db
      .select({ name: gearTable.name })
      .from(gearTable)
      .where(eq(gearTable.id, ctx.gearId))
      .limit(1);
    const gearName = rows[0]?.name ?? "this gear";
    void maybeGenerateReviewSummary({ gearId: ctx.gearId, gearName });
  }
}

export async function rejectReview(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const user = session?.user;
  if (!requireRole(user, ["MODERATOR"]))
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  await rejectReviewById(id);
}

export async function dismissReviewFlags(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const user = session.user;
  if (!requireRole(user, ["MODERATOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  await resolveOpenFlagsForReview({
    reviewId: id,
    status: "RESOLVED_KEEP",
    resolvedByUserId: user.id,
  });
}

export async function rejectReportedReview(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const user = session.user;
  if (!requireRole(user, ["MODERATOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const ctx = await getReviewUserAndGear(id);

  await Promise.all([
    rejectReviewById(id),
    resolveOpenFlagsForReview({
      reviewId: id,
      status: "RESOLVED_REJECTED",
      resolvedByUserId: user.id,
    }),
  ]);

  if (ctx?.gearId) {
    const rows = await db
      .select({ name: gearTable.name })
      .from(gearTable)
      .where(eq(gearTable.id, ctx.gearId))
      .limit(1);
    const gearName = rows[0]?.name ?? "this gear";
    void maybeGenerateReviewSummary({ gearId: ctx.gearId, gearName });
  }
}
