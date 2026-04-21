"use server";
import { revalidatePath } from "next/cache";
import "server-only";
import {
  updateDisplayName,
  updateProfileImage,
  updateSocialLinks,
  updateUserHandle,
} from "./service";

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

export async function actionUpdateSocialLinks(links: unknown) {
  const res = await updateSocialLinks(links);
  revalidatePath("/profile/settings");
  revalidatePath("/u/[handle]", "page");
  return res;
}

export async function actionUpdateUserHandle(handle: string) {
  const res = await updateUserHandle(handle);
  revalidatePath("/profile/settings");
  revalidatePath("/u/[handle]", "page");
  return res;
}
