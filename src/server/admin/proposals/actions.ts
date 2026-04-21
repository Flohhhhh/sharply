"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { approveProposal,mergeProposal,rejectProposal } from "./service";

function revalidateProposalApprovalPaths(gearSlug: string) {
  revalidatePath("/admin");
  revalidatePath("/lists/under-construction");
  if (gearSlug) {
    revalidatePath(`/gear/${gearSlug}`);
  }
}

export async function actionApproveProposal(
  id: string,
  filteredPayload: any = undefined,
  gearContext: { gearName: string; gearSlug: string },
) {
  await approveProposal(id, filteredPayload, gearContext);
  revalidateProposalApprovalPaths(gearContext.gearSlug);
}

export async function actionMergeProposal(id: string) {
  await mergeProposal(id);
  revalidatePath("/admin");
}

export async function actionRejectProposal(id: string) {
  await rejectProposal(id);
  revalidatePath("/admin");
}
