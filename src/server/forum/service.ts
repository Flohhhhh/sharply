import "server-only";

import { z } from "zod";
import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";
import {
  isValidForumContent,
  MAX_FORUM_CONTENT_SERIALIZED_LENGTH,
} from "~/lib/forum/content";
import {
  getForumThreadById,
  insertForumCategory,
  insertForumPost,
  insertForumThread,
  listForumCategories,
  listForumThreads,
  listOpenForumReports,
  setForumBestAnswer,
} from "./data";

const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullable().optional(),
});

const threadInputSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().trim().min(5).max(240),
  content: z
    .string()
    .max(MAX_FORUM_CONTENT_SERIALIZED_LENGTH)
    .refine(isValidForumContent),
});

const postInputSchema = z.object({
  threadId: z.string().min(1),
  content: z
    .string()
    .max(MAX_FORUM_CONTENT_SERIALIZED_LENGTH)
    .refine(isValidForumContent),
});

function toSlug(value: string) {
  const base = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  return `${base || "discussion"}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function fetchForumHome() {
  const [categories, threads] = await Promise.all([
    listForumCategories(),
    listForumThreads(100),
  ]);

  return { categories, threads };
}

export async function fetchForumCategories() {
  return listForumCategories();
}

export async function fetchForumThreads() {
  return listForumThreads();
}

export async function fetchForumThread(threadId: string) {
  return getForumThreadById(threadId);
}

export async function fetchForumAdminOverview() {
  const [categories, reports] = await Promise.all([
    listForumCategories(),
    listOpenForumReports(),
  ]);

  return { categories, reports };
}

export async function createForumCategory(input: unknown) {
  const { user } = await getSessionOrThrow();
  if (!requireRole(user, ["ADMIN"])) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  const parsed = categoryInputSchema.parse(input);
  return insertForumCategory({
    name: parsed.name,
    slug: toSlug(parsed.name),
    description: parsed.description || null,
    createdById: user.id,
  });
}

export async function createForumThread(input: unknown) {
  const { user } = await getSessionOrThrow();
  const parsed = threadInputSchema.parse(input);

  return insertForumThread({
    ...parsed,
    slug: toSlug(parsed.title),
    authorUserId: user.id,
  });
}

export async function createForumPost(input: unknown) {
  const { user } = await getSessionOrThrow();
  const parsed = postInputSchema.parse(input);

  return insertForumPost({ ...parsed, authorUserId: user.id });
}

export async function chooseForumBestAnswer(input: {
  threadId: string;
  postId: string | null;
}) {
  const { user } = await getSessionOrThrow();
  const thread = await getForumThreadById(input.threadId);

  if (!thread) {
    throw Object.assign(new Error("Thread not found"), { status: 404 });
  }

  const isAuthor = thread.thread.authorUserId === user.id;
  const isModerator = requireRole(user, ["MODERATOR"]);
  if (!isAuthor && !isModerator) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  if (input.postId && !thread.posts.some((post) => post.id === input.postId)) {
    throw Object.assign(new Error("Post does not belong to this thread"), {
      status: 400,
    });
  }

  return setForumBestAnswer(input);
}
