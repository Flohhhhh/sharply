import "server-only";

import { asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  brands,
  forumCategories,
  forumPosts,
  forumReports,
  forumThreadGear,
  forumThreads,
  gear,
  users,
} from "~/server/db/schema";

export async function listForumCategories() {
  const rows = await db
    .select({
      id: forumCategories.id,
      name: forumCategories.name,
      slug: forumCategories.slug,
      description: forumCategories.description,
      sortOrder: forumCategories.sortOrder,
      createdById: forumCategories.createdById,
      createdAt: forumCategories.createdAt,
      updatedAt: forumCategories.updatedAt,
      threadCount: count(forumThreads.id),
      replyCount: sql<number>`coalesce(sum(${forumThreads.replyCount}), 0)`,
    })
    .from(forumCategories)
    .leftJoin(forumThreads, eq(forumThreads.categoryId, forumCategories.id))
    .groupBy(forumCategories.id)
    .orderBy(asc(forumCategories.sortOrder), asc(forumCategories.name));

  return rows.map((row) => ({
    ...row,
    threadCount: Number(row.threadCount),
    replyCount: Number(row.replyCount),
  }));
}

export async function listForumThreads(limit = 30) {
  return db
    .select({
      id: forumThreads.id,
      title: forumThreads.title,
      slug: forumThreads.slug,
      status: forumThreads.status,
      isPinned: forumThreads.isPinned,
      viewCount: forumThreads.viewCount,
      replyCount: forumThreads.replyCount,
      bestAnswerPostId: forumThreads.bestAnswerPostId,
      createdAt: forumThreads.createdAt,
      lastActivityAt: forumThreads.lastActivityAt,
      categoryId: forumCategories.id,
      categoryName: forumCategories.name,
      categorySlug: forumCategories.slug,
      authorName: users.name,
      authorHandle: users.handle,
      authorImage: users.image,
      authorMemberNumber: users.memberNumber,
    })
    .from(forumThreads)
    .innerJoin(forumCategories, eq(forumThreads.categoryId, forumCategories.id))
    .innerJoin(users, eq(forumThreads.authorUserId, users.id))
    .orderBy(desc(forumThreads.isPinned), desc(forumThreads.lastActivityAt))
    .limit(limit);
}

export async function getForumThreadById(threadId: string) {
  const threadRows = await db
    .select({
      id: forumThreads.id,
      title: forumThreads.title,
      slug: forumThreads.slug,
      status: forumThreads.status,
      isPinned: forumThreads.isPinned,
      viewCount: forumThreads.viewCount,
      replyCount: forumThreads.replyCount,
      bestAnswerPostId: forumThreads.bestAnswerPostId,
      createdAt: forumThreads.createdAt,
      lastActivityAt: forumThreads.lastActivityAt,
      categoryId: forumCategories.id,
      categoryName: forumCategories.name,
      categorySlug: forumCategories.slug,
      authorName: users.name,
      authorHandle: users.handle,
      authorMemberNumber: users.memberNumber,
      authorUserId: forumThreads.authorUserId,
    })
    .from(forumThreads)
    .innerJoin(forumCategories, eq(forumThreads.categoryId, forumCategories.id))
    .innerJoin(users, eq(forumThreads.authorUserId, users.id))
    .where(eq(forumThreads.id, threadId))
    .limit(1);

  const thread = threadRows[0];
  if (!thread) return null;

  const [posts, linkedGear] = await Promise.all([
    db
      .select({
        id: forumPosts.id,
        content: forumPosts.content,
        editCount: forumPosts.editCount,
        lastEditedAt: forumPosts.lastEditedAt,
        createdAt: forumPosts.createdAt,
        updatedAt: forumPosts.updatedAt,
        authorUserId: forumPosts.authorUserId,
        authorName: users.name,
        authorHandle: users.handle,
        authorImage: users.image,
        authorMemberNumber: users.memberNumber,
      })
      .from(forumPosts)
      .innerJoin(users, eq(forumPosts.authorUserId, users.id))
      .where(eq(forumPosts.threadId, threadId))
      .orderBy(asc(forumPosts.createdAt)),
    db
      .select({
        id: gear.id,
        slug: gear.slug,
        name: gear.name,
        thumbnailUrl: gear.thumbnailUrl,
        brandName: brands.name,
      })
      .from(forumThreadGear)
      .innerJoin(gear, eq(forumThreadGear.gearId, gear.id))
      .leftJoin(brands, eq(gear.brandId, brands.id))
      .where(eq(forumThreadGear.threadId, threadId))
      .orderBy(asc(gear.name)),
  ]);

  return { thread, posts, linkedGear };
}

export async function insertForumCategory(input: {
  name: string;
  slug: string;
  description: string | null;
  createdById: string;
}) {
  const [category] = await db.insert(forumCategories).values(input).returning();
  return category;
}

export async function insertForumThread(input: {
  categoryId: string;
  title: string;
  slug: string;
  authorUserId: string;
  content: string;
}) {
  return db.transaction(async (tx) => {
    const [thread] = await tx
      .insert(forumThreads)
      .values({
        categoryId: input.categoryId,
        title: input.title,
        slug: input.slug,
        authorUserId: input.authorUserId,
        replyCount: 0,
      })
      .returning();

    if (!thread) throw new Error("Forum thread could not be created");

    await tx.insert(forumPosts).values({
      threadId: thread.id,
      authorUserId: input.authorUserId,
      content: input.content,
    });

    return thread;
  });
}

export async function insertForumPost(input: {
  threadId: string;
  authorUserId: string;
  content: string;
}) {
  return db.transaction(async (tx) => {
    const [thread] = await tx
      .select({ status: forumThreads.status })
      .from(forumThreads)
      .where(eq(forumThreads.id, input.threadId))
      .limit(1);

    if (!thread)
      throw Object.assign(new Error("Thread not found"), { status: 404 });
    if (thread.status !== "OPEN") {
      throw Object.assign(new Error("Thread is not open"), { status: 409 });
    }

    const [post] = await tx.insert(forumPosts).values(input).returning();

    await tx
      .update(forumThreads)
      .set({
        replyCount: sql`${forumThreads.replyCount} + 1`,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(forumThreads.id, input.threadId));

    return post;
  });
}

export async function setForumBestAnswer(input: {
  threadId: string;
  postId: string | null;
}) {
  const [thread] = await db
    .update(forumThreads)
    .set({ bestAnswerPostId: input.postId, updatedAt: new Date() })
    .where(eq(forumThreads.id, input.threadId))
    .returning();
  return thread;
}

export async function listOpenForumReports() {
  return db
    .select({
      id: forumReports.id,
      postId: forumReports.postId,
      reason: forumReports.reason,
      createdAt: forumReports.createdAt,
      reporterName: users.name,
      reporterHandle: users.handle,
    })
    .from(forumReports)
    .innerJoin(users, eq(forumReports.reporterUserId, users.id))
    .where(eq(forumReports.status, "OPEN"))
    .orderBy(desc(forumReports.createdAt));
}
