import {
  archiveNotifications,
  deleteArchivedNotifications,
  markNotificationsRead,
  type NotificationDropdownData,
} from "./notification-dropdown-state";

export function getSharedHeaderNotificationsKey(params: {
  userId: string | null | undefined;
  isSessionPending: boolean;
}) {
  if (params.isSessionPending || !params.userId) {
    return null;
  }

  return "/api/notifications/header";
}

type ControllerDeps = {
  applyOptimisticData: (data: NotificationDropdownData) => void;
  revalidate: () => Promise<unknown>;
};

export async function markVisibleNotificationsRead(params: {
  data: NotificationDropdownData;
  nowIso: string;
  markRead: (id: string) => Promise<unknown>;
} & ControllerDeps) {
  const unreadIds = params.data.notifications
    .filter((notification) => !notification.readAt)
    .map((notification) => notification.id);

  if (!unreadIds.length) {
    return false;
  }

  params.applyOptimisticData(
    markNotificationsRead(params.data, unreadIds, params.nowIso),
  );

  try {
    await Promise.all(unreadIds.map((id) => params.markRead(id).catch(() => null)));
  } finally {
    await params.revalidate();
  }

  return true;
}

export async function archiveAllNotifications(params: {
  data: NotificationDropdownData;
  nowIso: string;
  archiveNotification: (id: string) => Promise<unknown>;
} & ControllerDeps) {
  const activeIds = params.data.notifications.map((notification) => notification.id);

  if (!activeIds.length) {
    return false;
  }

  params.applyOptimisticData(
    archiveNotifications(params.data, activeIds, params.nowIso),
  );

  try {
    await Promise.all(
      activeIds.map((id) => params.archiveNotification(id).catch(() => null)),
    );
  } finally {
    await params.revalidate();
  }

  return true;
}

export async function deleteAllArchivedNotifications(params: {
  data: NotificationDropdownData;
  deleteAllArchived: () => Promise<unknown>;
} & ControllerDeps) {
  const archivedIds = params.data.archived.map((notification) => notification.id);

  if (!archivedIds.length) {
    return false;
  }

  params.applyOptimisticData(
    deleteArchivedNotifications(params.data, archivedIds),
  );

  try {
    await params.deleteAllArchived();
  } finally {
    await params.revalidate();
  }

  return true;
}
