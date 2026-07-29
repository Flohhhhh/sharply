"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import {
  assignTagToGear,
  createTag,
  deleteTag,
  removeTagFromGear,
  updateTag,
} from "./service";

export async function actionCreateTag(input: unknown) {
  const tag = await createTag(input);
  revalidatePath("/admin/tags");
  revalidatePath("/tags");
  revalidatePath(`/tags/${tag.slug}`);
  return tag;
}

export async function actionUpdateTag(id: string, input: unknown) {
  const tag = await updateTag(id, input);
  revalidatePath("/admin/tags");
  revalidatePath("/tags");
  revalidatePath(`/tags/${tag.slug}`);
  return tag;
}

export async function actionDeleteTag(id: string) {
  await deleteTag(id);
  revalidatePath("/admin/tags");
  revalidatePath("/tags");
  revalidatePath("/tags/[slug]", "page");
}

export async function actionAssignTagToGear(gearId: string, tagId: string) {
  const result = await assignTagToGear({ gearId, tagId });
  revalidatePath(`/gear/${result.slug}`);
  revalidatePath(`/tags/${result.tagSlug}`);
  revalidatePath("/admin/tags");
}

export async function actionRemoveTagFromGear(gearId: string, tagId: string) {
  const result = await removeTagFromGear({ gearId, tagId });
  revalidatePath(`/gear/${result.slug}`);
  revalidatePath(`/tags/${result.tagSlug}`);
  revalidatePath("/admin/tags");
}
