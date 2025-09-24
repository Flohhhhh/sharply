"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { updateDisplayName } from "./service";

export async function actionUpdateDisplayName(name: string) {
  const res = await updateDisplayName(name);
  revalidatePath("/profile/settings");
  return res;
}
