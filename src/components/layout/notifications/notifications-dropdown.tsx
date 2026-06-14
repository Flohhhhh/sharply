"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, Loader } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { NotificationItem } from "./notification-item";
import {
  getTabAfterClearingAllNotifications,
  shouldDisableDeleteAllArchived,
  type NotificationDropdownData,
  type NotificationDropdownTab,
} from "./notification-dropdown-state";

type NotificationsDropdownProps = {
  data: NotificationDropdownData;
  isPending?: boolean;
  isClearing?: boolean;
  onOpen?: () => void;
  onClearAll?: () => void;
  onDeleteAllArchived?: () => void;
};

export function NotificationsDropdown({
  data,
  isPending = false,
  isClearing = false,
  onOpen,
  onClearAll,
  onDeleteAllArchived,
}: NotificationsDropdownProps) {
  const t = useTranslations("notifications");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationDropdownTab>("inbox");
  const [unreadOnOpen, setUnreadOnOpen] = useState<Set<string>>(new Set());

  const hasUnread = data.unreadCount > 0;
  const activeNotifications = data.notifications;
  const archivedNotifications = data.archived;
  const inboxCount = activeNotifications.length;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) return;

    const unreadIds = new Set<string>();
    for (const notification of data.notifications) {
      if (!notification.readAt) {
        unreadIds.add(notification.id);
      }
    }

    setUnreadOnOpen(unreadIds);
    onOpen?.();
  };

  const emptyState = (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-sm">
      <Bell className="size-5" />
      <p>{t("empty")}</p>
    </div>
  );

  const archivedEmptyState = (
    <div className="text-muted-foreground px-4 py-3 text-sm">
      {t("archivedEmpty")}
    </div>
  );

  const handleClearAllClick = () => {
    setActiveTab((currentTab) => getTabAfterClearingAllNotifications(currentTab));
    onClearAll?.();
  };

  const deleteAllArchivedDisabled = shouldDisableDeleteAllArchived({
    archivedCount: archivedNotifications.length,
    isPending,
    isClearing,
  });

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
          aria-label={t("title")}
        >
          <Bell className="size-5" />
          {hasUnread ? (
            <span className="bg-destructive text-destructive-foreground ring-background absolute -top-1 -right-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ring-2">
              {data.unreadCount >= 10 ? "9+" : data.unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-background max-h-[70vh] min-h-[300px] w-[420px] overflow-hidden rounded-lg border p-0"
        align="end"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold">{t("title")}</div>
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
                onClick={handleClearAllClick}
              >
                {t("clearAll")}
              </Button>
            </div>
          ) : (
            <div className="flex h-8 items-center">
              {isPending ? (
                <Loader className="text-muted-foreground size-4 animate-spin" />
              ) : null}
            </div>
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
            {t("inbox")}
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
            {t("archived")}
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
                  {activeNotifications.map((notification) => (
                    <li key={notification.id}>
                      <NotificationItem
                        notification={notification}
                        wasUnread={unreadOnOpen.has(notification.id)}
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
                    disabled={deleteAllArchivedDisabled}
                    onClick={onDeleteAllArchived}
                  >
                    {t("deleteAll")}
                  </Button>
                </div>
              ) : null}
              {archivedNotifications.length === 0 ? (
                archivedEmptyState
              ) : (
                <ul>
                  {archivedNotifications.map((notification) => (
                    <li key={notification.id}>
                      <NotificationItem
                        notification={notification}
                        wasUnread={unreadOnOpen.has(notification.id)}
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
