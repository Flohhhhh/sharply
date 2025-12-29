import "server-only";

import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import { headers } from "next/headers";
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const user = session?.user;
  if (!requireRole(user, ["EDITOR"]))
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  return listAllReviewsWithContext();
}

export async function approveReview(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const user = session?.user;
  if (!requireRole(user, ["ADMIN", "EDITOR"]))
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
  if (!requireRole(user, ["ADMIN", "EDITOR"]))
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  await rejectReviewById(id);
}
