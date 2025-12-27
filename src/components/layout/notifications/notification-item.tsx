"use client";

import Link from "next/link";
import { Award, BadgeCheck, Bell } from "lucide-react";
import { cn, formatRelativeTime } from "~/lib/utils";
import type { NotificationView } from "~/server/notifications/service";
import type { ComponentType } from "react";

type IconEntry = { icon: ComponentType<{ className?: string }> };

const typeIconMap: Record<NotificationView["type"], IconEntry> = {
  gear_spec_approved: { icon: BadgeCheck },
  badge_awarded: { icon: Award },
};

const NotificationIcon = ({ type }: { type: NotificationView["type"] }) => {
  const entry = typeIconMap[type];
  const Icon = entry?.icon ?? Bell;
  return <Icon className="text-muted-foreground mt-1 size-5" />;
};

const UnreadDot = () => (
  <span className="bg-primary inline-block h-2.5 w-2.5 rounded-full" />
);

type NotificationItemProps = {
  notification: NotificationView;
  wasUnread?: boolean;
};

const NotificationBody = ({
  notification,
  wasUnread = false,
}: {
  notification: NotificationView;
  wasUnread?: boolean;
}) => {
  return (
    <div className="flex items-start gap-2 p-2">
      <NotificationIcon type={notification.type} />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">{notification.title}</div>
          </div>
          {wasUnread ? (
            <div className="relative">
              <span className="absolute right-1 z-10 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
              <span className="absolute right-1 z-10 inline-block h-2.5 w-2.5 shrink-0 animate-ping rounded-full bg-blue-500" />
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2">
          {notification.body ? (
            <div className="text-muted-foreground w-full max-w-[250px] text-sm">
              {notification.body}
            </div>
          ) : null}
          <span className="text-muted-foreground text-xs">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export function NotificationItem({
  notification,
  wasUnread = false,
}: NotificationItemProps) {
  const clickable = !!notification.linkUrl;
  const wrapperClasses =
    "block rounded-md border border-transparent transition group-hover:bg-muted/50 group-hover:border-border";

  return (
    <div
      className={cn(
        "p-2",
        clickable ? "group cursor-pointer" : "",
        !notification.readAt ? "bg-muted/50" : "bg-background",
      )}
    >
      {clickable ? (
        <Link href={notification.linkUrl!} className={wrapperClasses}>
          <NotificationBody notification={notification} wasUnread={wasUnread} />
        </Link>
      ) : (
        <NotificationBody notification={notification} wasUnread={wasUnread} />
      )}
    </div>
  );
}
