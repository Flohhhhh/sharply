import "server-only";

import { db } from "~/server/db";
import { reviewFlags, reviews, gear, users } from "~/server/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export async function listAllReviewsWithContext() {
  return db
    .select({
      id: reviews.id,
      status: reviews.status,
      content: reviews.content,
      genres: reviews.genres,
      recommend: reviews.recommend,
      createdAt: reviews.createdAt,
      userId: users.id,
      userName: users.name,
      gearId: gear.id,
      gearName: gear.name,
      gearSlug: gear.slug,
    })
    .from(reviews)
    .leftJoin(gear, eq(reviews.gearId, gear.id))
    .leftJoin(users, eq(reviews.createdById, users.id))
    .orderBy(desc(reviews.createdAt));
}

export async function listOpenReviewFlagStats() {
  return db
    .select({
      reviewId: reviewFlags.reviewId,
      openFlagsCount: sql<number>`count(*)`,
      latestFlagAt: sql<Date>`max(${reviewFlags.createdAt})`,
    })
    .from(reviewFlags)
    .where(eq(reviewFlags.status, "OPEN"))
    .groupBy(reviewFlags.reviewId);
}

export async function approveReviewById(id: string) {
  await db
    .update(reviews)
    .set({ status: "APPROVED" })
    .where(eq(reviews.id, id));
}

export async function rejectReviewById(id: string) {
  await db
    .update(reviews)
    .set({ status: "REJECTED" })
    .where(eq(reviews.id, id));
}

export async function resolveOpenFlagsForReview(params: {
  reviewId: string;
  status: "RESOLVED_KEEP" | "RESOLVED_REJECTED" | "RESOLVED_DELETED";
  resolvedByUserId: string;
}) {
  const now = new Date();
  await db
    .update(reviewFlags)
    .set({
      status: params.status,
      resolvedByUserId: params.resolvedByUserId,
      resolvedAt: now,
      updatedAt: now,
    })
    .where(
      and(eq(reviewFlags.reviewId, params.reviewId), eq(reviewFlags.status, "OPEN")),
    );
}

export async function getReviewUserAndGear(id: string) {
  const rows = await db
    .select({ userId: reviews.createdById, gearId: reviews.gearId })
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1);
  return rows[0] ?? null;
}
