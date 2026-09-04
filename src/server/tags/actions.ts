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
import { invalidatePublicTagOptionsCache } from "./cache";

export async function actionCreateTag(input: unknown) {
  const tag = await createTag(input);
  invalidatePublicTagOptionsCache();
  revalidateLocalizedPaths(["/admin/tags", "/tags", `/tags/${tag.slug}`]);
  return tag;
}

export async function actionUpdateTag(id: string, input: unknown) {
  const tag = await updateTag(id, input);
  invalidatePublicTagOptionsCache();
  revalidateLocalizedPaths(["/admin/tags", "/tags", `/tags/${tag.slug}`]);
  return tag;
}

export async function actionDeleteTag(id: string) {
  await deleteTag(id);
  invalidatePublicTagOptionsCache();
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
