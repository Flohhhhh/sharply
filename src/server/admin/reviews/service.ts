import "server-only";

import { auth, requireRole } from "~/server/auth";
import {
  approveReviewById,
  rejectReviewById,
  listAllReviewsWithContext,
} from "./data";

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
  await approveReviewById(id);
}

export async function rejectReview(id: string) {
  const session = await auth();
  if (!requireRole(session, ["ADMIN", "EDITOR"]))
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  await rejectReviewById(id);
}
