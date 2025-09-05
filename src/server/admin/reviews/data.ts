import "server-only";

import { db } from "~/server/db";
import { reviews, gear, users } from "~/server/db/schema";
import { and, desc, eq } from "drizzle-orm";

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
