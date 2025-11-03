"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { createGearAdmin, renameGearService, setGearThumbnailService, clearGearThumbnailService } from "./service";
import type { GearCreationParams } from "./data";

export async function actionCreateGear(params: GearCreationParams) {
  const result = await createGearAdmin(params);
  revalidatePath("/admin");
  return result;
}

export async function actionRenameGear(params: {
  gearId: string;
  newName: string;
}) {
  const result = await renameGearService(params);
  // Revalidate both old and new paths
  revalidatePath("/admin/gear");
  revalidatePath(`/gear/${result.slug}`);
  return result;
}

export async function actionSetGearThumbnail(params: {
  gearId?: string;
  slug?: string;
  thumbnailUrl: string;
}) {
  const result = await setGearThumbnailService(params);
  revalidatePath("/admin/gear");
  revalidatePath(`/gear/${result.slug}`);
  return result;
}

export async function actionClearGearThumbnail(params: {
  gearId?: string;
  slug?: string;
}) {
  const result = await clearGearThumbnailService(params);
  revalidatePath("/admin/gear");
  revalidatePath(`/gear/${result.slug}`);
  return result;
}
