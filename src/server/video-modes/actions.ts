"use server";

import {
  rebuildVideoSummariesForSlug,
  saveVideoModesForGearSlug,
} from "./service";
import { revalidateGearPages } from "~/server/revalidation";

export async function actionSaveVideoModes(slug: string, payload: unknown) {
  const result = await saveVideoModesForGearSlug(slug, payload);
  revalidateGearPages([slug]);
  return result;
}

export async function actionRegenerateVideoSummaries(slug: string) {
  const result = await rebuildVideoSummariesForSlug(slug);
  revalidateGearPages([slug]);
  return result;
}
