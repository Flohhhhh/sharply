"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleCheck,
  Sparkles,
} from "lucide-react";
import { GENRES } from "~/lib/generated";
import { cn } from "~/lib/utils";
import { Separator } from "~/components/ui/separator";

type GenreRatingsMap = Record<string, string | null | undefined>;

export function GenreRatings({
  genreRatings,
  gearName,
}: {
  genreRatings: GenreRatingsMap;
  gearName: string;
}) {
  const bySlug = React.useMemo(
    () => new Map((GENRES as any[]).map((g: any) => [g.slug as string, g])),
    [],
  );

  const ratings = React.useMemo(
    () => Object.entries(genreRatings ?? {}),
    [genreRatings],
  );

  const visible = React.useMemo(
    () => ratings.filter(([, v]) => v && v !== "0"),
    [ratings],
  );

  const getMeta = (v: string | null | undefined) => {
    if (v === "3")
      return {
        label: "Excels",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/5 border-blue-500/40",
        Icon: Sparkles,
      } as const;
    if (v === "2")
      return {
        label: "Acceptable",
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-500/5 border-green-500/40",
        Icon: CircleCheck,
      } as const;
    if (v === "1")
      return {
        label: "Underperforms",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/5 border-amber-500/40",
        Icon: AlertTriangle,
      } as const;
    return {
      label: "N/A",
      color: "text-muted-foreground",
      bg: "",
      Icon: Circle,
    } as const;
  };

  type Item = {
    slug: string;
    value: string;
    displayName: string;
    description?: string;
  };

  const groups = React.useMemo(() => {
    const g: Record<"3" | "2" | "1", Item[]> = { "3": [], "2": [], "1": [] };
    for (const [slug, value] of visible) {
      if (value !== "1" && value !== "2" && value !== "3") continue;
      const genre = bySlug.get(slug);
      const displayName =
        (genre?.name as string) ?? slug.charAt(0).toUpperCase() + slug.slice(1);
      const description = (genre?.description as string) ?? undefined;
      g[value].push({ slug, value, displayName, description });
    }
    (Object.keys(g) as Array<keyof typeof g>).forEach((k) => {
      g[k].sort((a, b) => a.displayName.localeCompare(b.displayName));
    });
    return g;
  }, [visible, bySlug]);

  const columns: Array<{ key: "3" | "2" | "1"; title: string }> = [
    { key: "3", title: "Excels" },
    { key: "2", title: "Acceptable" },
    { key: "1", title: "Underperforms" },
  ];

  return (
    <div className="mx-auto mt-4 max-w-3xl">
      <div className="mb-2">
        <h3 className="scroll-mt-24 text-lg font-semibold">
          {gearName} <span className="sr-only">-</span> Genre Ratings
        </h3>
      </div>

      <div className="rounded-md p-0">
        <div className="mt-0 grid grid-cols-1 gap-4 md:grid-cols-3">
          {columns.map(({ key, title }) => {
            const list = groups[key];
            const meta = getMeta(key);
            const HeaderIcon = meta.Icon;
            return (
              <div key={key} className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${meta.color}`}>
                    <HeaderIcon className="h-4 w-4" />
                    <span className="font-medium">{title}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {list.length}
                  </span>
                </div>
                <Separator className="my-4" />
                <div className="mt-2 space-y-2">
                  {list.map(({ slug, value, displayName, description }) => {
                    const { color, Icon, label, bg } = getMeta(value);
                    return (
                      <Tooltip key={slug}>
                        <TooltipTrigger asChild>
                          <div
                            className={`flex items-center gap-3 rounded-md border-2 px-4 py-5 ${bg}`}
                          >
                            {/* <Icon className={`h-4 w-4 ${color}`} /> */}
                            <div className="flex min-w-0 flex-col">
                              <span
                                className={cn("text-sm font-medium", color)}
                              >
                                {displayName}
                              </span>
                              {/* <span className={`text-sm ${color}`}>
                                {label}
                              </span> */}
                            </div>
                          </div>
                        </TooltipTrigger>
                        {description ? (
                          <TooltipContent
                            side="top"
                            className="max-w-xs leading-snug text-pretty"
                          >
                            {description}
                          </TooltipContent>
                        ) : null}
                      </Tooltip>
                    );
                  })}

                  {list.length === 0 ? (
                    <div className="text-muted-foreground rounded-md border border-dashed p-3 text-xs">
                      No items
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Separator className="my-4" />
    </div>
  );
}
