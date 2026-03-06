"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import {
  archiveCompletedCommunityBingoBoard,
  createNextCommunityBingoBoard,
  submitCommunityBingoTileClaim,
} from "./service";

function revalidateBingoPaths() {
  revalidatePath("/community/bingo", "page");
}

export async function actionSubmitCommunityBingoTileClaim(params: {
  tileId: string;
  discordMessageUrl: string;
  note?: string;
}) {
  const result = await submitCommunityBingoTileClaim(params);
  revalidateBingoPaths();
  return result;
}

export async function actionArchiveCompletedCommunityBingoBoard(boardId: string) {
  const result = await archiveCompletedCommunityBingoBoard(boardId);
  revalidateBingoPaths();
  return result;
}

export async function actionCreateNextCommunityBingoBoard(params?: {
  title?: string;
}) {
  const result = await createNextCommunityBingoBoard(params);
  revalidateBingoPaths();
  return result;
}
