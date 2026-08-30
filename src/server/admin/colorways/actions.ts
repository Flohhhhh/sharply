"use server";
import "server-only";

import {
  isGearImageReviewRejectedError,
  reviewRejectionResult,
} from "~/lib/gear/image-review-result";
import {
  revalidateGearPages,
  revalidateLocalizedPaths,
} from "~/server/revalidation";

import {
  createGearColorwayService,
  deleteGearColorwayService,
  enableGearColorwaysService,
  reorderGearColorwaysService,
  resetGearColorwaysService,
  setGearColorwayImageService,
  updateGearColorwayService,
} from "./service";

async function revalidateColorwayResult<T extends { gearSlug: string }>(
  result: T,
) {
  revalidateGearPages([result.gearSlug], { includeBrowse: true });
  revalidateLocalizedPaths(["/admin/gear"]);
  return result;
}

export async function actionEnableGearColorways(
  params: Parameters<typeof enableGearColorwaysService>[0],
) {
  return revalidateColorwayResult(await enableGearColorwaysService(params));
}

export async function actionCreateGearColorway(
  params: Parameters<typeof createGearColorwayService>[0],
) {
  return revalidateColorwayResult(await createGearColorwayService(params));
}

export async function actionUpdateGearColorway(
  params: Parameters<typeof updateGearColorwayService>[0],
) {
  return revalidateColorwayResult(await updateGearColorwayService(params));
}

export async function actionReorderGearColorways(
  params: Parameters<typeof reorderGearColorwaysService>[0],
) {
  return revalidateColorwayResult(await reorderGearColorwaysService(params));
}

export async function actionDeleteGearColorway(
  params: Parameters<typeof deleteGearColorwayService>[0],
) {
  return revalidateColorwayResult(await deleteGearColorwayService(params));
}

export async function actionResetGearColorways(
  params: Parameters<typeof resetGearColorwaysService>[0],
) {
  return revalidateColorwayResult(await resetGearColorwaysService(params));
}

export async function actionSetGearColorwayImage(
  params: Parameters<typeof setGearColorwayImageService>[0],
) {
  try {
    return revalidateColorwayResult(await setGearColorwayImageService(params));
  } catch (error) {
    if (isGearImageReviewRejectedError(error))
      return reviewRejectionResult(error);
    throw error;
  }
}
