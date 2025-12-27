import "server-only";

import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";

export type NotificationRow = typeof notifications.$inferSelect;

export type CreateNotificationParams = {
  userId: string;
  type: NotificationRow["type"];
  title: string;
  body?: string | null;
  linkUrl?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  metadata?: unknown;
  readAt?: Date | null;
  archivedAt?: Date | null;
};

export async function createNotificationData(
  params: CreateNotificationParams,
): Promise<NotificationRow> {
  const inserted = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      linkUrl: params.linkUrl ?? null,
      sourceType: params.sourceType ?? null,
      sourceId: params.sourceId ?? null,
      metadata: (params.metadata ?? null) as any,
      readAt: params.readAt ?? null,
      archivedAt: params.archivedAt ?? null,
    })
    .returning();
  return inserted[0]!;
}

export async function fetchNotificationsData(options: {
  userId: string;
  archived?: boolean;
  limit?: number;
}) {
  const { userId, archived = false, limit = 20 } = options;
  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        archived ? isNotNull(notifications.archivedAt) : isNull(notifications.archivedAt),
      ),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows;
}

export async function countUnreadNotificationsData(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
        isNull(notifications.archivedAt),
      ),
    );
  return Number(row?.value ?? 0);
}

export async function markNotificationReadData(id: string, userId: string) {
  const [row] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning();
  return row ?? null;
}

export async function archiveNotificationData(id: string, userId: string) {
  const now = new Date();
  const [row] = await db
    .update(notifications)
    .set({
      archivedAt: now,
      readAt: now,
    })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, userId),
        isNull(notifications.archivedAt),
      ),
    )
    .returning();
  return row ?? null;
}

export async function deleteNotificationData(id: string, userId: string) {
  const existing = await db.query.notifications.findFirst({
    where: and(eq(notifications.id, id), eq(notifications.userId, userId)),
    columns: {
      id: true,
      archivedAt: true,
    },
  });
  if (!existing) return { deleted: false, reason: "not_found" } as const;
  if (!existing.archivedAt)
    return { deleted: false, reason: "not_archived" } as const;

  await db.delete(notifications).where(eq(notifications.id, id));
  return { deleted: true, reason: null } as const;
}

