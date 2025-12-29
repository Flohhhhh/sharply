import "server-only";

import { auth } from "~/auth";
import { headers } from "next/headers";
import { getSessionOrThrow } from "~/server/auth";
import {
  archiveNotificationData,
  countUnreadNotificationsData,
  createNotificationData,
  deleteNotificationData,
  fetchNotificationsData,
  markNotificationReadData,
  type CreateNotificationParams,
  type NotificationRow,
} from "./data";

export type NotificationType = NotificationRow["type"];

export type NotificationView = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  linkUrl: string | null;
  sourceType: string | null;
  sourceId: string | null;
  metadata: unknown;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
};

type NotificationFetchResult = {
  notifications: NotificationView[];
  archived: NotificationView[];
  unreadCount: number;
  userId: string | null;
};

function mapNotification(row: NotificationRow): NotificationView {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body ?? null,
    linkUrl: row.linkUrl ?? null,
    sourceType: row.sourceType ?? null,
    sourceId: row.sourceId ?? null,
    metadata: row.metadata ?? null,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createNotification(params: CreateNotificationParams) {
  const row = await createNotificationData(params);
  return mapNotification(row);
}

export async function fetchNotificationsForUser(options: {
  userId: string;
  limit?: number;
  archivedLimit?: number;
}): Promise<NotificationFetchResult> {
  const { userId, limit = 10, archivedLimit = 5 } = options;
  const [active, archived, unreadCount] = await Promise.all([
    fetchNotificationsData({ userId, limit, archived: false }),
    fetchNotificationsData({ userId, limit: archivedLimit, archived: true }),
    countUnreadNotificationsData(userId),
  ]);

  return {
    userId,
    notifications: active.map(mapNotification),
    archived: archived.map(mapNotification),
    unreadCount,
  };
}

export async function getCurrentUserNotifications(
  options?: Partial<
    Pick<
      Parameters<typeof fetchNotificationsForUser>[0],
      "limit" | "archivedLimit"
    >
  >,
): Promise<NotificationFetchResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return {
      userId: null,
      notifications: [],
      archived: [],
      unreadCount: 0,
    };
  }

  return fetchNotificationsForUser({
    userId: session.user.id,
    limit: options?.limit,
    archivedLimit: options?.archivedLimit,
  });
}

export async function markNotificationRead(id: string) {
  const { user } = await getSessionOrThrow();
  const row = await markNotificationReadData(id, user.id);
  if (!row) throw new Error("Notification not found");
  return mapNotification(row);
}

export async function archiveNotification(id: string) {
  const { user } = await getSessionOrThrow();
  const row = await archiveNotificationData(id, user.id);
  if (!row) throw new Error("Notification not found or already archived");
  return mapNotification(row);
}

export async function deleteNotification(id: string) {
  const { user } = await getSessionOrThrow();
  const result = await deleteNotificationData(id, user.id);
  if (!result.deleted) {
    if (result.reason === "not_archived") {
      throw new Error("Notification must be archived before deletion");
    }
    throw new Error("Notification not found");
  }
  return { deleted: true as const };
}
