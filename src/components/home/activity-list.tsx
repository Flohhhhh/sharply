import * as React from "react";
import Link from "next/link";
import { PencilLine, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { HomeActivityItem } from "~/server/gear/home-activity";

const EVENT_ICONS = {
  created: Plus,
  updated: PencilLine,
} satisfies Record<
  HomeActivityItem["eventType"],
  React.ComponentType<{ className?: string }>
>;

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

export async function ActivityList({
  items,
  locale,
}: {
  items: HomeActivityItem[];
  locale: string;
}) {
  if (!items.length) return null;
  const t = await getTranslations({ locale, namespace: "home" });

  const eventLabels: Record<HomeActivityItem["eventType"], string> = {
    created: t("activityCreated"),
    updated: t("activityUpdated"),
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold">{t("activityTitle")}</h2>
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
      </div>
      <ol className="divide-border divide-y rounded-md border">
        {items.map((item) => {
          const Icon = EVENT_ICONS[item.eventType];

          return (
            <li key={item.id} className="p-0">
              <Link
                href={`/gear/${item.slug}`}
                className="group flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="bg-muted/35 rounded-lg text-muted-foreground flex size-6 shrink-0 items-center justify-center">
                    <Icon className="size-3" />
                  </span>
                  <span className="min-w-0 truncate">
                    <span className="font-medium group-hover:underline">
                      {item.name}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {eventLabels[item.eventType]}
                    </span>
                  </span>
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatRelativeTimeForLocale(item.eventAt, locale)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
