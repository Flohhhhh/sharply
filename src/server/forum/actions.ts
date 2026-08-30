"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { locales } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";
import {
  chooseForumBestAnswer,
  createForumCategory,
  createForumPost,
  createForumThread,
} from "./service";

function revalidateForumPaths(...paths: string[]) {
  for (const locale of locales) {
    for (const path of paths) {
      revalidatePath(localizePathname(path, locale));
    }
  }
}

export async function actionCreateForumCategory(input: unknown) {
  const category = await createForumCategory(input);
  revalidateForumPaths("/forum", "/admin/forums");
  return category;
}

export async function actionCreateForumThread(input: unknown) {
  const thread = await createForumThread(input);
  revalidateForumPaths("/forum", "/forum/new", `/forum/t/${thread.id}`);
  return thread;
}

export async function actionCreateForumPost(input: unknown) {
  const post = await createForumPost(input);
  if (post) {
    revalidateForumPaths("/forum", `/forum/t/${post.threadId}`);
  }
  return post;
}

export async function actionChooseForumBestAnswer(input: {
  threadId: string;
  postId: string | null;
}) {
  const thread = await chooseForumBestAnswer(input);
  revalidateForumPaths("/forum", `/forum/t/${input.threadId}`);
  return thread;
}
