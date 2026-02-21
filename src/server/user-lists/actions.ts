"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import {
  addGearToUserList,
  createUserList,
  deleteUserList,
  publishUserList,
  removeGearFromUserList,
  removeUserListItem,
  renameUserList,
  reorderUserListItems,
  unpublishUserList,
} from "./service";

function revalidateCommonPaths() {
  revalidatePath("/u/[handle]", "page");
  revalidatePath("/list/[shared]", "page");
}

export async function actionCreateUserList(name: string) {
  const result = await createUserList(name);
  revalidateCommonPaths();
  return result;
}

export async function actionRenameUserList(listId: string, name: string) {
  const result = await renameUserList(listId, name);
  revalidateCommonPaths();
  return result;
}

export async function actionDeleteUserList(listId: string) {
  const result = await deleteUserList(listId);
  revalidateCommonPaths();
  return result;
}

export async function actionAddGearToUserList(params: {
  listId: string;
  slug: string;
}) {
  const result = await addGearToUserList(params);
  revalidateCommonPaths();
  revalidatePath(`/gear/${params.slug}`);
  return result;
}

export async function actionRemoveGearFromUserList(params: {
  listId: string;
  slug: string;
}) {
  const result = await removeGearFromUserList(params);
  revalidateCommonPaths();
  revalidatePath(`/gear/${params.slug}`);
  return result;
}

export async function actionRemoveUserListItem(itemId: string) {
  const result = await removeUserListItem(itemId);
  revalidateCommonPaths();
  return result;
}

export async function actionReorderUserListItems(params: {
  listId: string;
  orderedItemIds: string[];
}) {
  const result = await reorderUserListItems(params);
  revalidateCommonPaths();
  return result;
}

export async function actionPublishUserList(listId: string) {
  const result = await publishUserList(listId);
  revalidateCommonPaths();
  if (result.sharedPath) {
    revalidatePath(result.sharedPath);
  }
  return result;
}

export async function actionUnpublishUserList(listId: string) {
  const result = await unpublishUserList(listId);
  revalidateCommonPaths();
  if (result.sharedPath) {
    revalidatePath(result.sharedPath);
  }
  return result;
}
