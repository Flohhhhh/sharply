"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import {
  fetchSamplesByGearId,
  createSampleFile,
  deleteSampleFile,
  trackSampleDownload,
} from "./service";

export async function actionFetchSamples(gearId: string) {
  return fetchSamplesByGearId(gearId);
}

export async function actionCreateSample(params: {
  gearId: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileSizeBytes: number;
  fileExtension: string;
  slug: string;
}) {
  const { slug, ...rest } = params;
  const result = await createSampleFile(rest);
  revalidatePath(`/gear/${slug}`);
  return result;
}

export async function actionDeleteSample(id: string, slug: string) {
  await deleteSampleFile(id);
  revalidatePath(`/gear/${slug}`);
}

export async function actionTrackDownload(id: string, userId?: string) {
  await trackSampleDownload(id, userId);
}
