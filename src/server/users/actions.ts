"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { updateDisplayName, updateProfileImage } from "./service";

export async function actionUpdateDisplayName(name: string) {
  const res = await updateDisplayName(name);
  revalidatePath("/profile/settings");
  return res;
}

export async function actionUpdateProfileImage(imageUrl: string) {
  const res = await updateProfileImage(imageUrl);
  revalidatePath("/profile/settings");
  return res;
}
