"use client";

import type { HeaderNotificationsData } from "~/components/layout/header-model";

export type NotificationDropdownData = NonNullable<HeaderNotificationsData>;
export type NotificationDropdownTab = "inbox" | "archived";

export const EMPTY_NOTIFICATION_DROPDOWN_DATA: NotificationDropdownData = {
  notifications: [],
  archived: [],
  unreadCount: 0,
};

export function getTabAfterClearingAllNotifications(
  activeTab: NotificationDropdownTab,
): NotificationDropdownTab {
  if (activeTab === "inbox") {
    return "archived";
  }

  return activeTab;
}

export function shouldDisableDeleteAllArchived(params: {
  archivedCount: number;
  isPending: boolean;
  isClearing: boolean;
}) {
  return (
    params.archivedCount === 0 || params.isPending || params.isClearing
  );
}

export function markNotificationsRead(
  data: NotificationDropdownData,
  ids: string[],
  nowIso: string,
): NotificationDropdownData {
  if (!ids.length) return data;

  const idSet = new Set(ids);
  let readCount = 0;

  const notifications = data.notifications.map((notification) => {
    if (!idSet.has(notification.id) || notification.readAt) {
      return notification;
    }

    readCount += 1;
    return {
      ...notification,
      readAt: nowIso,
    };
  });

  if (readCount === 0) return data;

  return {
    ...data,
    notifications,
    unreadCount: Math.max(data.unreadCount - readCount, 0),
  };
}

export function archiveNotifications(
  data: NotificationDropdownData,
  ids: string[],
  nowIso: string,
): NotificationDropdownData {
  if (!ids.length) return data;

  const idSet = new Set(ids);
  let unreadArchivedCount = 0;
  const archivedBatch: NotificationDropdownData["archived"] = [];
  const notifications: NotificationDropdownData["notifications"] = [];

  for (const notification of data.notifications) {
    if (!idSet.has(notification.id)) {
      notifications.push(notification);
      continue;
    }

    if (!notification.readAt) {
      unreadArchivedCount += 1;
    }

    archivedBatch.push({
      ...notification,
      readAt: notification.readAt ?? nowIso,
      archivedAt: nowIso,
    });
  }

  if (!archivedBatch.length) return data;

  return {
    notifications,
    archived: [...archivedBatch, ...data.archived],
    unreadCount: Math.max(data.unreadCount - unreadArchivedCount, 0),
  };
}

export function deleteArchivedNotifications(
  data: NotificationDropdownData,
  ids: string[],
): NotificationDropdownData {
  if (!ids.length) return data;

  const idSet = new Set(ids);
  const archived = data.archived.filter((notification) => !idSet.has(notification.id));

  if (archived.length === data.archived.length) return data;

  return {
    ...data,
    archived,
  };
}
