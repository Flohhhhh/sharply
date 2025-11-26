"use server";

import { revalidatePath } from "next/cache";
import {
  getVideoModesForGearSlug,
  rebuildVideoSummariesForSlug,
  saveVideoModesForGearSlug,
} from "./service";

export async function actionLoadVideoModes(slug: string) {
  return getVideoModesForGearSlug(slug);
}

export async function actionSaveVideoModes(slug: string, payload: unknown) {
  const result = await saveVideoModesForGearSlug(slug, payload);
  revalidatePath(`/gear/${slug}`);
  return result;
}

export async function actionRegenerateVideoSummaries(slug: string) {
  const result = await rebuildVideoSummariesForSlug(slug);
  revalidatePath(`/gear/${slug}`);
  return result;
}

