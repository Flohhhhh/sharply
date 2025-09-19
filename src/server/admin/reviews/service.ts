import "server-only";

import { auth, requireRole } from "~/server/auth";
import {
  approveReviewById,
  rejectReviewById,
  listAllReviewsWithContext,
  getReviewUserAndGear,
} from "./data";
import { evaluateForEvent } from "~/server/badges/service";
import { maybeGenerateReviewSummary } from "~/server/reviews/summary/service";
import { db } from "~/server/db";
import { gear as gearTable } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function fetchAdminReviews() {
  const session = await auth();
  if (!requireRole(session, ["ADMIN", "EDITOR"]))
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  return listAllReviewsWithContext();
}

export async function approveReview(id: string) {
  const session = await auth();
  if (!requireRole(session, ["ADMIN", "EDITOR"]))
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
  const session = await auth();
  if (!requireRole(session, ["ADMIN", "EDITOR"]))
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  await rejectReviewById(id);
}
