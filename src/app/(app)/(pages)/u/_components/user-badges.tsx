import { BADGE_CATALOG } from "~/lib/badges/catalog";
import { fetchUserBadges } from "~/server/badges/service";
import * as Lucide from "lucide-react";
import { toRomanNumeral } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export async function UserBadges({ userId }: { userId: string }) {
  const rows = await fetchUserBadges(userId);
  if (!rows.length) return null;

  const keyToMeta = new Map(BADGE_CATALOG.map((b) => [b.key, b] as const));
  const toPascal = (s: string) =>
    s
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("");

  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold">Badges</h2>
      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {rows
            .map((r) => ({ row: r, meta: keyToMeta.get(r.badgeKey) }))
            .sort((a, b) => {
              const aScore = (a.row.sortOverride ??
                a.meta?.sortScore ??
                0) as number;
              const bScore = (b.row.sortOverride ??
                b.meta?.sortScore ??
                0) as number;
              if (bScore !== aScore) return bScore - aScore;
              const aTs = new Date(
                a.row.awardedAt as unknown as string,
              ).getTime();
              const bTs = new Date(
                b.row.awardedAt as unknown as string,
              ).getTime();
              return bTs - aTs;
            })
            .map(({ row: r, meta }) => {
              const Icon = meta?.iconComponent || Lucide.Award;
              return (
                <Tooltip key={`${r.badgeKey}-${String(r.awardedAt)}`}>
                  <TooltipTrigger asChild>
                    <div
                      className="bg-card text-card-foreground relative flex aspect-[3/4] h-12 flex-col items-center justify-center overflow-hidden rounded-md border p-1"
                      style={{ background: meta?.color, color: meta?.color }}
                    >
                      {meta?.levelIndex ? (
                        <div className="rounded px-1 text-sm font-semibold text-white">
                          {toRomanNumeral(meta.levelIndex)}
                        </div>
                      ) : null}
                      <Icon fill="currentColor" className="size-5 text-white" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="border-border text-primary-foreground dark:bg-background mb-2 border bg-white">
                    <div className="space-y-1">
                      <div className="text-primary text-sm font-semibold">
                        {meta?.label ?? r.badgeKey}
                      </div>
                      {meta?.description ? (
                        <div className="text-muted-foreground max-w-[220px] text-sm">
                          {meta.description}
                        </div>
                      ) : null}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
        </div>
      </TooltipProvider>
    </div>
  );
}
