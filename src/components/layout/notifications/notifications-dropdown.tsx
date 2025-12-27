"use client";

import { useMemo, useState, useTransition } from "react";
import { Bell, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "~/lib/utils";
import {
  actionMarkNotificationRead,
  actionDeleteNotification,
  actionArchiveNotification,
} from "~/server/notifications/actions";
import type { NotificationView } from "~/server/notifications/service";
import { NotificationItem } from "./notification-item";

type NotificationsDropdownProps = {
  data: {
    notifications: NotificationView[];
    archived: NotificationView[];
    unreadCount: number;
  };
};

type NotificationState = NotificationsDropdownProps["data"];

export function NotificationsDropdown({ data }: NotificationsDropdownProps) {
  const [state, setState] = useState<NotificationState>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"inbox" | "archived">("inbox");
  const [isClearing, setIsClearing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [unreadOnOpen, setUnreadOnOpen] = useState<Set<string>>(new Set());

  const hasUnread = state.unreadCount > 0;
  const activeNotifications = state.notifications;
  const archivedNotifications = state.archived;
  const inboxCount = state.notifications.length;

  const unreadVisible = useMemo(
    () => state.notifications.filter((n) => !n.readAt),
    [state.notifications],
  );

  // Optimistically mark all visible unread notifications as read on open.
  const markVisibleAsRead = () => {
    if (!unreadVisible.length) return;
    const nowIso = new Date().toISOString();
    setState((prev) => {
      const updated = prev.notifications.map((n) =>
        n.readAt ? n : { ...n, readAt: nowIso },
      );
      return {
        ...prev,
        notifications: updated,
        unreadCount: Math.max(prev.unreadCount - unreadVisible.length, 0),
      };
    });
    startTransition(() => {
      void Promise.all(
        unreadVisible.map((n) => actionMarkNotificationRead(n.id)),
      );
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Capture which items were unread at open time for the indicator dot.
      const unseenIds = new Set(
        state.notifications.filter((n) => !n.readAt).map((n) => n.id),
      );
      setUnreadOnOpen(unseenIds);
      markVisibleAsRead();
    }
  };

  const handleClearAll = () => {
    if (!activeNotifications.length) return;
    const optimisticArchivedAt = new Date().toISOString();
    const optimisticBatch = activeNotifications.map((n) => ({
      ...n,
      readAt: n.readAt ?? optimisticArchivedAt,
      archivedAt: optimisticArchivedAt,
    }));

    setState((prev) => ({
      ...prev,
      unreadCount: 0,
      notifications: [],
      archived: [...optimisticBatch, ...prev.archived],
    }));

    setIsClearing(true);
    startTransition(() => {
      void (async () => {
        const results = await Promise.all(
          activeNotifications.map((n) =>
            actionArchiveNotification(n.id).catch(() => null),
          ),
        );
        const updatesById = new Map(
          results
            .filter((r): r is NotificationView => !!r)
            .map((r) => [r.id, r]),
        );
        setState((prev) => ({
          ...prev,
          archived: prev.archived.map((n) => updatesById.get(n.id) ?? n),
        }));
        setIsClearing(false);
      })();
    });
  };

  const handleDeleteAllArchived = () => {
    if (!archivedNotifications.length) return;
    const ids = archivedNotifications.map((n) => n.id);
    setState((prev) => ({ ...prev, archived: [] }));
    startTransition(() => {
      void Promise.all(
        ids.map((id) => actionDeleteNotification(id).catch(() => null)),
      ).then(() => {
        // no-op; optimistic removal already applied
      });
    });
  };

  const emptyState = (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-sm">
      <Bell className="size-5" />
      <p>No notifications yet.</p>
    </div>
  );

  const archivedEmptyState = (
    <div className="text-muted-foreground px-4 py-3 text-sm">
      No archived notifications.
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {hasUnread ? (
            <span className="bg-destructive text-destructive-foreground ring-background absolute -top-1 -right-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ring-2">
              {Math.min(state.unreadCount, 9)}
              {state.unreadCount > 9 ? "+" : ""}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-background max-h-[70vh] min-h-[300px] w-[420px] overflow-hidden rounded-lg border p-0"
        align="end"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold">Notifications</div>
          {activeTab === "inbox" ? (
            <div className="flex items-center gap-2">
              {isPending ? (
                <Loader className="text-muted-foreground size-4 animate-spin" />
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                disabled={!activeNotifications.length || isClearing}
                onClick={handleClearAll}
              >
                Clear all
              </Button>
            </div>
          ) : (
            <div className="h-8" />
          )}
        </div>
        <div className="flex items-center gap-3 px-4 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("inbox")}
            className={cn(
              "text-muted-foreground flex items-center gap-1 border-b-2 pb-1 text-sm transition-colors",
              activeTab === "inbox"
                ? "border-primary text-foreground"
                : "hover:text-foreground border-transparent",
            )}
          >
            Inbox
            <span className="text-muted-foreground text-[11px]">
              {inboxCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            className={cn(
              "text-muted-foreground flex items-center gap-1 border-b-2 pb-1 text-sm transition-colors",
              activeTab === "archived"
                ? "border-primary text-foreground"
                : "hover:text-foreground border-transparent",
            )}
          >
            Archived
            <span className="text-muted-foreground text-[11px]">
              {archivedNotifications.length}
            </span>
          </button>
        </div>
        <Separator />
        <ScrollArea className="max-h-[60vh] overflow-y-auto">
          {activeTab === "inbox" ? (
            <section>
              {activeNotifications.length === 0 ? (
                emptyState
              ) : (
                <ul>
                  {activeNotifications.map((n) => (
                    <li key={n.id}>
                      <NotificationItem
                        notification={n}
                        wasUnread={unreadOnOpen.has(n.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <section>
              {archivedNotifications.length > 0 ? (
                <div className="px-4 py-2">
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!archivedNotifications.length}
                    onClick={handleDeleteAllArchived}
                  >
                    Delete all
                  </Button>
                </div>
              ) : null}
              {archivedNotifications.length === 0 ? (
                archivedEmptyState
              ) : (
                <ul>
                  {archivedNotifications.map((n) => (
                    <li key={n.id}>
                      <NotificationItem
                        notification={n}
                        wasUnread={unreadOnOpen.has(n.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
