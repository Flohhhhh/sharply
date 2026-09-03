"use server";
import "server-only";

import {
  revalidateGearPages,
  revalidateLocalizedPaths,
} from "~/server/revalidation";
import {
  assignTagToGear,
  createTag,
  deleteTag,
  removeTagFromGear,
  updateTag,
} from "./service";

export async function actionCreateTag(input: unknown) {
  const tag = await createTag(input);
  revalidateLocalizedPaths(["/admin/tags", "/tags", `/tags/${tag.slug}`]);
  return tag;
}

export async function actionUpdateTag(id: string, input: unknown) {
  const tag = await updateTag(id, input);
  revalidateLocalizedPaths(["/admin/tags", "/tags", `/tags/${tag.slug}`]);
  return tag;
}

export async function actionDeleteTag(id: string) {
  await deleteTag(id);
  revalidateLocalizedPaths(["/admin/tags", "/tags"]);
  revalidateLocalizedPaths(["/tags/[slug]"], "page");
}

export async function actionAssignTagToGear(gearId: string, tagId: string) {
  const result = await assignTagToGear({ gearId, tagId });
  revalidateGearPages([result.slug]);
  revalidateLocalizedPaths([`/tags/${result.tagSlug}`, "/admin/tags"]);
}

export async function actionRemoveTagFromGear(gearId: string, tagId: string) {
  const result = await removeTagFromGear({ gearId, tagId });
  revalidateGearPages([result.slug]);
  revalidateLocalizedPaths([`/tags/${result.tagSlug}`, "/admin/tags"]);
}
