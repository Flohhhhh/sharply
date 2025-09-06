import "server-only";

import { auth, requireRole } from "~/server/auth";
import {
  approveReviewById,
  rejectReviewById,
  listAllReviewsWithContext,
  getReviewUserAndGear,
} from "./data";
import { evaluateForEvent } from "~/server/badges/service";

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
}

export async function rejectReview(id: string) {
  const session = await auth();
  if (!requireRole(session, ["ADMIN", "EDITOR"]))
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  await rejectReviewById(id);
}
