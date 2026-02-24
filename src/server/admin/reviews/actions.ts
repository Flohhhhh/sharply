"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import {
  approveReview,
  dismissReviewFlags,
  rejectReportedReview,
  rejectReview,
} from "./service";

export async function actionApproveReview(id: string) {
  await approveReview(id);
  // Revalidate admin page sections if needed
  revalidatePath("/admin");
}

export async function actionRejectReview(id: string) {
  await rejectReview(id);
  revalidatePath("/admin");
}

export async function actionDismissReviewFlags(id: string) {
  await dismissReviewFlags(id);
  revalidatePath("/admin");
}

export async function actionRejectReportedReview(id: string) {
  await rejectReportedReview(id);
  revalidatePath("/admin");
}
