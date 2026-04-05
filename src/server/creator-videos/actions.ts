"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import {
  createGearCreatorVideo,
  deactivateGearCreatorVideo,
  updateGearCreatorVideoEditorialNote,
} from "./service";

export async function actionCreateGearCreatorVideo(
  slug: string,
  input: unknown,
) {
  const result = await createGearCreatorVideo(slug, input);
  revalidatePath(`/gear/${slug}`);
  return result;
}

export async function actionUpdateGearCreatorVideoEditorialNote(
  slug: string,
  id: string,
  input: unknown,
) {
  const result = await updateGearCreatorVideoEditorialNote(id, input);
  revalidatePath(`/gear/${slug}`);
  return result;
}

export async function actionDeactivateGearCreatorVideo(slug: string, id: string) {
  const result = await deactivateGearCreatorVideo(id);
  revalidatePath(`/gear/${slug}`);
  return result;
}
