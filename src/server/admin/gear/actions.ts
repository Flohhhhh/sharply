"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { type GearRegion } from "~/lib/gear/region";
import {
  clearGearRearViewService,
  clearGearThumbnailService,
  clearGearTopViewService,
  createGearAdmin,
  deleteGearService,
  renameGearService,
  setGearOgImageService,
  setGearRearViewService,
  setGearThumbnailService,
  setGearTopViewService,
  updateGearAliasesService,
  type GearCreationParams,
} from "./service";

export async function actionCreateGear(params: GearCreationParams) {
  const result = await createGearAdmin(params);
  revalidatePath("/admin");
  revalidatePath("/browse");
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
  revalidatePath("/browse");
  return result;
}

export async function actionUpdateGearAliases(params: {
  gearId: string;
  gearSlug?: string;
  aliases: { region: GearRegion; name: string | null }[];
}) {
  const { ...rest } = params;
  const result = await updateGearAliasesService(rest);
  revalidatePath("/admin/gear");
  if (params.gearSlug) {
    revalidatePath(`/gear/${params.gearSlug}`);
  } else {
    revalidatePath("/gear");
  }
  revalidatePath("/browse");
  return result;
}

export async function actionSetGearThumbnail(params: {
  gearId?: string;
  slug?: string;
  thumbnailUrl: string;
  ogImageUrl?: string | null;
}) {
  const result = await setGearThumbnailService(params);
  revalidatePath("/admin/gear");
  revalidatePath(`/gear/${result.slug}`);
  revalidatePath("/browse");
  return result;
}

export async function actionSetGearOgImage(params: {
  gearId?: string;
  slug?: string;
  ogImageUrl: string | null;
}) {
  const result = await setGearOgImageService(params);
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
  revalidatePath("/browse");
  return result;
}

export async function actionSetGearTopView(params: {
  gearId?: string;
  slug?: string;
  topViewUrl: string;
}) {
  const result = await setGearTopViewService(params);
  revalidatePath("/admin/gear");
  revalidatePath(`/gear/${result.slug}`);
  revalidatePath("/browse");
  return result;
}

export async function actionClearGearTopView(params: {
  gearId?: string;
  slug?: string;
}) {
  const result = await clearGearTopViewService(params);
  revalidatePath("/admin/gear");
  revalidatePath(`/gear/${result.slug}`);
  revalidatePath("/browse");
  return result;
}

export async function actionSetGearRearView(params: {
  gearId?: string;
  slug?: string;
  rearViewUrl: string;
}) {
  const result = await setGearRearViewService(params);
  revalidatePath("/admin/gear");
  revalidatePath(`/gear/${result.slug}`);
  revalidatePath("/browse");
  return result;
}

export async function actionClearGearRearView(params: {
  gearId?: string;
  slug?: string;
}) {
  const result = await clearGearRearViewService(params);
  revalidatePath("/admin/gear");
  revalidatePath(`/gear/${result.slug}`);
  revalidatePath("/browse");
  return result;
}

export async function actionDeleteGear(gearId: string) {
  const result = await deleteGearService(gearId);
  revalidatePath("/admin/gear");
  revalidatePath(`/gear/${result.slug}`);
  revalidatePath("/browse");
  return result;
}
