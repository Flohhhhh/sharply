"use server";
import { revalidatePath } from "next/cache";
import "server-only";
import {
  clearProfileImage,
  updateDisplayName,
  updatePreferredFilters,
  updateProfileImage,
  updateAvatarSource,
  updateSocialLinks,
  updateUserHandle,
} from "./service";
import type { AvatarSource } from "~/lib/auth/avatar";
import {
  disconnectLinkedAccount,
  syncCurrentDiscordAvatar,
  type SupportedProvider,
} from "~/server/auth/account-linking";

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

export async function actionClearProfileImage() {
  const res = await clearProfileImage();
  revalidatePath("/profile/settings");
  revalidatePath("/u/[handle]", "page");
  return res;
}

export async function actionUpdateAvatarSource(source: AvatarSource) {
  const res = await updateAvatarSource(source);
  revalidatePath("/u/[handle]", "page");
  return res;
}

export async function actionDisconnectLinkedAccount(
  provider: SupportedProvider,
  accountId: string,
) {
  const result = await disconnectLinkedAccount(provider, accountId);
  revalidatePath("/profile/settings");
  revalidatePath("/u/[handle]", "page");
  return result;
}

export async function actionSyncCurrentDiscordAvatar() {
  const result = await syncCurrentDiscordAvatar();
  revalidatePath("/profile/settings");
  revalidatePath("/u/[handle]", "page");
  return result;
}

export async function actionUpdateSocialLinks(links: unknown) {
  const res = await updateSocialLinks(links);
  revalidatePath("/profile/settings");
  revalidatePath("/u/[handle]", "page");
  return res;
}

export async function actionUpdatePreferredFilters(preferences: unknown) {
  const res = await updatePreferredFilters(preferences);
  revalidatePath("/profile/settings");
  return res;
}

export async function actionUpdateUserHandle(handle: string) {
  const res = await updateUserHandle(handle);
  revalidatePath("/profile/settings");
  revalidatePath("/u/[handle]", "page");
  return res;
}
