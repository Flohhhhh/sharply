"use client";

import { useEffect, useState } from "react";
import {
  actionArchiveNotification,
  actionDeleteAllArchivedNotifications,
  actionMarkNotificationRead,
} from "~/server/notifications/actions";
import { NotificationsDropdown } from "./notifications-dropdown";
import { type NotificationDropdownData } from "./notification-dropdown-state";
import {
  archiveAllNotifications,
  deleteAllArchivedNotifications,
  markVisibleNotificationsRead,
} from "./shared-header-notifications-controller";

type NotificationsDropdownStatefulProps = {
  data: NotificationDropdownData;
};

export function NotificationsDropdownStateful({
  data,
}: NotificationsDropdownStatefulProps) {
  const [state, setState] = useState<NotificationDropdownData>(data);
  const [isClearing, setIsClearing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setState(data);
  }, [data]);

  const applyOptimisticData = (nextData: NotificationDropdownData) => {
    setState(nextData);
  };

  const revalidate = async () => undefined;

  const handleOpen = () => {
    void markVisibleNotificationsRead({
      data: state,
      nowIso: new Date().toISOString(),
      applyOptimisticData,
      revalidate,
      markRead: actionMarkNotificationRead,
    });
  };

  const handleClearAll = () => {
    setIsClearing(true);
    setIsPending(true);
    void archiveAllNotifications({
      data: state,
      nowIso: new Date().toISOString(),
      applyOptimisticData,
      revalidate,
      archiveNotification: actionArchiveNotification,
    }).finally(() => {
      setIsClearing(false);
      setIsPending(false);
    });
  };

  const handleDeleteAllArchived = () => {
    setIsPending(true);
    void deleteAllArchivedNotifications({
      data: state,
      applyOptimisticData,
      revalidate,
      deleteAllArchived: actionDeleteAllArchivedNotifications,
    }).finally(() => {
      setIsPending(false);
    });
  };

  return (
    <NotificationsDropdown
      data={state}
      isPending={isPending}
      isClearing={isClearing}
      onOpen={handleOpen}
      onClearAll={handleClearAll}
      onDeleteAllArchived={handleDeleteAllArchived}
    />
  );
}
