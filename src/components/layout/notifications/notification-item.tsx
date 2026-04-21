"use client";

import Link from "next/link";
import { Award, BadgeCheck, Bell } from "lucide-react";
import { cn } from "~/lib/utils";
import type { NotificationView } from "~/server/notifications/service";
import type { ComponentType } from "react";
import { useLocale, useTranslations } from "next-intl";

type IconEntry = { icon: ComponentType<{ className?: string }> };

const typeIconMap: Record<NotificationView["type"], IconEntry> = {
  gear_spec_approved: { icon: BadgeCheck },
  badge_awarded: { icon: Award },
  prompt_handle_setup: { icon: Bell },
};

const NotificationIcon = ({ type }: { type: NotificationView["type"] }) => {
  const entry = typeIconMap[type];
  const Icon = entry?.icon ?? Bell;
  return <Icon className="text-muted-foreground mt-1 size-5" />;
};

type NotificationItemProps = {
  notification: NotificationView;
  wasUnread?: boolean;
};

function formatRelativeTimeForLocale(
  input: Date | string | number,
  locale: string,
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  const diffWeek = Math.round(diffDay / 7);

  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "short",
  });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  if (Math.abs(diffDay) < 7) return rtf.format(diffDay, "day");
  return rtf.format(diffWeek, "week");
}

function extractGearNameFromApprovalBody(body: string | null): string | null {
  if (!body) return null;

  const normalized = body.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.+?) is now updated(?:\.)?(?: Click to view the page\.)?$/i);
  return match?.[1]?.trim() || null;
}

function getLocalizedNotificationContent(
  notification: NotificationView,
  t: ReturnType<typeof useTranslations>,
): { title: string; body: string | null } {
  if (notification.type === "gear_spec_approved") {
    const metadata = notification.metadata as
      | { gearName?: string | null }
      | null
      | undefined;
    const gearName =
      metadata?.gearName ??
      extractGearNameFromApprovalBody(notification.body) ??
      t("gearFallback");

    return {
      title: t("gearSpecApprovedTitle"),
      body: t("gearSpecApprovedBody", { gearName }),
    };
  }

  if (notification.type === "badge_awarded") {
    const metadata = notification.metadata as
      | { badgeName?: string | null }
      | null
      | undefined;

    return {
      title: metadata?.badgeName
        ? t("badgeAwardedTitleNamed", { badgeName: metadata.badgeName })
        : t("badgeAwardedTitle"),
      body: t("badgeAwardedBody"),
    };
  }

  return {
    title: notification.title,
    body: notification.body,
  };
}

const NotificationBody = ({
  notification,
  wasUnread = false,
}: {
  notification: NotificationView;
  wasUnread?: boolean;
}) => {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const content = getLocalizedNotificationContent(notification, t);

  return (
    <div className="flex items-start gap-2 p-2">
      <NotificationIcon type={notification.type} />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">{content.title}</div>
          </div>
          {wasUnread ? (
            <div className="relative">
              <span className="absolute right-1 z-10 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
              <span className="absolute right-1 z-10 inline-block h-2.5 w-2.5 shrink-0 animate-ping rounded-full bg-blue-500" />
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2">
          {content.body ? (
            <div className="text-muted-foreground w-full max-w-[250px] text-sm">
              {content.body}
            </div>
          ) : null}
          <span className="text-muted-foreground text-xs">
            {formatRelativeTimeForLocale(notification.createdAt, locale)}
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
