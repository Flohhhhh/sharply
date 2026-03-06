"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import {
  claimTileWithSubmission,
  completeActiveBingoBoardForDevelopment,
  skipActiveBingoBoardByAdmin,
} from "./service";

export async function actionClaimBingoTile(params: {
  boardTileId: string;
  discordMessageUrl: string;
}) {
  const result = await claimTileWithSubmission(params);
  revalidatePath("/discord/bingo");
  return result;
}

export async function actionSkipBingoCard() {
  const result = await skipActiveBingoBoardByAdmin();
  revalidatePath("/discord/bingo");
  return result;
}

export async function actionCompleteBingoCardForDevelopment() {
  const result = await completeActiveBingoBoardForDevelopment();
  revalidatePath("/discord/bingo");
  return result;
}
