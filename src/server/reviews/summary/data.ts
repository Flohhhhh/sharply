// In Next.js runtime, enforce server-only import. In scripts (Node), skip.
if (process.env.NEXT_RUNTIME) {
  import("server-only").catch(() => {
    console.warn("[ai-summary:data] server-only import failed, skipping.");
  });
}

import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { reviews, reviewSummaries } from "~/server/db/schema";

export async function countApprovedReviewsForGear(
  gearId: string,
): Promise<number> {
  console.log("[ai-summary:data] countApprovedReviewsForGear", { gearId });
  const row = await db
    .select({ c: sql<number>`count(*)` })
    .from(reviews)
    .where(and(eq(reviews.gearId, gearId), eq(reviews.status, "APPROVED")));
  return Number(row?.[0]?.c ?? 0);
}

export async function fetchRecentApprovedReviews(
  gearId: string,
  limit = 40,
): Promise<
  { content: string; recommend: boolean | null; genres: string[] | null }[]
> {
  console.log("[ai-summary:data] fetchRecentApprovedReviews", {
    gearId,
    limit,
  });
  const rows = await db
    .select({
      content: reviews.content,
      recommend: reviews.recommend,
      genres: reviews.genres,
    })
    .from(reviews)
    .where(and(eq(reviews.gearId, gearId), eq(reviews.status, "APPROVED")))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    content: r.content ?? "",
    recommend: r.recommend ?? null,
    genres: (r.genres as string[] | null) ?? null,
  }));
}

export async function getReviewSummaryRow(gearId: string) {
  console.log("[ai-summary:data] getReviewSummaryRow", { gearId });
  const rows = await db
    .select({
      gearId: reviewSummaries.gearId,
      summaryText: reviewSummaries.summaryText,
      updatedAt: reviewSummaries.updatedAt,
    })
    .from(reviewSummaries)
    .where(eq(reviewSummaries.gearId, gearId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertReviewSummary(params: {
  gearId: string;
  summaryText: string;
}) {
  const { gearId, summaryText } = params;
  console.log("[ai-summary:data] upsertReviewSummary", {
    gearId,
    chars: summaryText.length,
  });
  await db
    .insert(reviewSummaries)
    .values({ gearId, summaryText })
    .onConflictDoUpdate({
      target: reviewSummaries.gearId,
      set: { summaryText, updatedAt: sql`now()` },
    });
}

export async function isSummaryOlderThanDays(
  gearId: string,
  days: number,
): Promise<boolean> {
  console.log("[ai-summary:data] isSummaryOlderThanDays", { gearId, days });
  const rows = await db
    .select({
      fresh: gt(
        reviewSummaries.updatedAt,
        sql`now() - interval '${sql.raw(String(days))} days'`,
      ),
    })
    .from(reviewSummaries)
    .where(eq(reviewSummaries.gearId, gearId))
    .limit(1);
  const fresh = rows[0]?.fresh;
  if (fresh === undefined) return true; // no row exists → treat as old
  return !fresh;
}

export async function backdateSummaryTimestamp(
  gearId: string,
  daysAgo: number,
) {
  console.log("[ai-summary:data] backdateSummaryTimestamp", {
    gearId,
    daysAgo,
  });
  await db
    .update(reviewSummaries)
    .set({
      updatedAt: sql`now() - interval '${sql.raw(String(daysAgo))} days'`,
    })
    .where(eq(reviewSummaries.gearId, gearId));
}
