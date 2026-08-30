"use server";
import "server-only";

import {
  createGearCreatorVideo,
  deactivateGearCreatorVideo,
  updateGearCreatorVideoEditorialNote,
} from "./service";
import { revalidateGearPages } from "~/server/revalidation";

export async function actionCreateGearCreatorVideo(
  slug: string,
  input: unknown,
) {
  const result = await createGearCreatorVideo(slug, input);
  revalidateGearPages([slug]);
  return result;
}

export async function actionUpdateGearCreatorVideoEditorialNote(
  slug: string,
  id: string,
  input: unknown,
) {
  const result = await updateGearCreatorVideoEditorialNote(id, input);
  revalidateGearPages([slug]);
  return result;
}

export async function actionDeactivateGearCreatorVideo(
  slug: string,
  id: string,
) {
  const result = await deactivateGearCreatorVideo(id);
  revalidateGearPages([slug]);
  return result;
}
