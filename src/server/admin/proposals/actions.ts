"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { approveProposal, mergeProposal, rejectProposal } from "./service";

export async function actionApproveProposal(id: string, filteredPayload?: any) {
  await approveProposal(id, filteredPayload);
  revalidatePath("/admin");
}

export async function actionMergeProposal(id: string) {
  await mergeProposal(id);
  revalidatePath("/admin");
}

export async function actionRejectProposal(id: string) {
  await rejectProposal(id);
  revalidatePath("/admin");
}
