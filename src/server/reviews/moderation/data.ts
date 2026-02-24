if (process.env.NEXT_RUNTIME) {
  import("server-only").catch(() => {
    console.warn("[review-moderation:data] server-only import failed.");
  });
}

import { desc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { reviews } from "~/server/db/schema";

export async function fetchRecentReviewCreatedAtsByUser(
  userId: string,
  limit: number,
): Promise<number[]> {
  const rows = await db
    .select({ createdAt: reviews.createdAt })
    .from(reviews)
    .where(eq(reviews.createdById, userId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);

  return rows
    .map((row) => row.createdAt?.getTime())
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => b - a);
}
