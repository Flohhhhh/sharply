"use server";
import "server-only";

import { revalidatePath } from "next/cache";

import { locales } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";
import {
  assignTagToGear,
  createTag,
  deleteTag,
  removeTagFromGear,
  updateTag,
} from "./service";

function revalidateLocalizedPaths(...pathnames: string[]) {
  for (const locale of locales) {
    for (const pathname of pathnames) {
      revalidatePath(localizePathname(pathname, locale));
    }
  }
}

function revalidateLocalizedPage(pathname: string) {
  for (const locale of locales) {
    revalidatePath(localizePathname(pathname, locale), "page");
  }
}

export async function actionCreateTag(input: unknown) {
  const tag = await createTag(input);
  revalidateLocalizedPaths("/admin/tags", "/tags", `/tags/${tag.slug}`);
  return tag;
}

export async function actionUpdateTag(id: string, input: unknown) {
  const tag = await updateTag(id, input);
  revalidateLocalizedPaths("/admin/tags", "/tags", `/tags/${tag.slug}`);
  return tag;
}

export async function actionDeleteTag(id: string) {
  await deleteTag(id);
  revalidateLocalizedPaths("/admin/tags", "/tags");
  revalidateLocalizedPage("/tags/[slug]");
}

export async function actionAssignTagToGear(gearId: string, tagId: string) {
  const result = await assignTagToGear({ gearId, tagId });
  revalidateLocalizedPaths(
    `/gear/${result.slug}`,
    `/tags/${result.tagSlug}`,
    "/admin/tags",
  );
}

export async function actionRemoveTagFromGear(gearId: string, tagId: string) {
  const result = await removeTagFromGear({ gearId, tagId });
  revalidateLocalizedPaths(
    `/gear/${result.slug}`,
    `/tags/${result.tagSlug}`,
    "/admin/tags",
  );
}
