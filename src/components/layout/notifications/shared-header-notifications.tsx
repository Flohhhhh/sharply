"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import useSWR from "swr";
import { fetchJson } from "~/lib/fetch-json";
import {
  actionArchiveNotification,
  actionDeleteAllArchivedNotifications,
  actionMarkNotificationRead,
} from "~/server/notifications/actions";
import { NotificationsDropdown } from "./notifications-dropdown";
import {
  EMPTY_NOTIFICATION_DROPDOWN_DATA,
  type NotificationDropdownData,
} from "./notification-dropdown-state";
import {
  archiveAllNotifications,
  deleteAllArchivedNotifications,
  getSharedHeaderNotificationsKey,
  markVisibleNotificationsRead,
} from "./shared-header-notifications-controller";

type SharedHeaderNotificationsProviderProps = {
  children: ReactNode;
  userId: string | null;
  isSessionPending: boolean;
};

type SharedHeaderNotificationsContextValue = {
  data: NotificationDropdownData;
  isClearing: boolean;
  isPending: boolean;
  onClearAll: () => void;
  onDeleteAllArchived: () => void;
  onOpen: () => void;
};

const SharedHeaderNotificationsContext =
  createContext<SharedHeaderNotificationsContextValue | null>(null);

const SHARED_HEADER_NOTIFICATIONS_REFRESH_INTERVAL_MS = 30_000;

const sharedHeaderNotificationsFetcher = (url: string) =>
  fetchJson<NotificationDropdownData | null>(url, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

export function SharedHeaderNotificationsProvider({
  children,
  userId,
  isSessionPending,
}: SharedHeaderNotificationsProviderProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const swrKey = getSharedHeaderNotificationsKey({
    userId,
    isSessionPending,
  });
  const { data, mutate } = useSWR<NotificationDropdownData | null>(
    swrKey,
    sharedHeaderNotificationsFetcher,
    {
      keepPreviousData: true,
      refreshInterval: SHARED_HEADER_NOTIFICATIONS_REFRESH_INTERVAL_MS,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      shouldRetryOnError: false,
    },
  );

  const notificationsData = data ?? EMPTY_NOTIFICATION_DROPDOWN_DATA;

  const applyOptimisticData = (nextData: NotificationDropdownData) => {
    void mutate(nextData, { revalidate: false });
  };

  const revalidate = () => mutate();

  const value: SharedHeaderNotificationsContextValue = {
    data: notificationsData,
    isClearing,
    isPending,
    onOpen: () => {
      void markVisibleNotificationsRead({
        data: notificationsData,
        nowIso: new Date().toISOString(),
        applyOptimisticData,
        revalidate,
        markRead: actionMarkNotificationRead,
      });
    },
    onClearAll: () => {
      setIsClearing(true);
      setIsPending(true);
      void archiveAllNotifications({
        data: notificationsData,
        nowIso: new Date().toISOString(),
        applyOptimisticData,
        revalidate,
        archiveNotification: actionArchiveNotification,
      }).finally(() => {
        setIsClearing(false);
        setIsPending(false);
      });
    },
    onDeleteAllArchived: () => {
      setIsPending(true);
      void deleteAllArchivedNotifications({
        data: notificationsData,
        applyOptimisticData,
        revalidate,
        deleteAllArchived: actionDeleteAllArchivedNotifications,
      }).finally(() => {
        setIsPending(false);
      });
    },
  };

  return (
    <SharedHeaderNotificationsContext.Provider value={value}>
      {children}
    </SharedHeaderNotificationsContext.Provider>
  );
}

export function useSharedHeaderNotifications() {
  const context = useContext(SharedHeaderNotificationsContext);

  if (!context) {
    throw new Error(
      "useSharedHeaderNotifications must be used within SharedHeaderNotificationsProvider",
    );
  }

  return context;
}

export function SharedHeaderNotificationsDropdown() {
  const { data, isClearing, isPending, onClearAll, onDeleteAllArchived, onOpen } =
    useSharedHeaderNotifications();

  return (
    <NotificationsDropdown
      data={data}
      isPending={isPending}
      isClearing={isClearing}
      onOpen={onOpen}
      onClearAll={onClearAll}
      onDeleteAllArchived={onDeleteAllArchived}
    />
  );
}
