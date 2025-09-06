"use client";

import type { BadgeDefinition } from "~/types/badges";
import * as Lucide from "lucide-react";
import { toRomanNumeral } from "~/lib/utils";

export function BadgeTile({ badge }: { badge: BadgeDefinition }) {
  const Icon = (badge.iconComponent ?? Lucide.Award) as React.ComponentType<{
    className?: string;
    fill?: string;
  }>;

  return (
    <div
      className={`bg-card text-card-foreground relative flex aspect-[3/4] h-12 flex-col items-center justify-center overflow-hidden rounded-md p-1`}
      style={{ background: badge.color, color: badge.color }}
      aria-label={badge.label}
      title={badge.label}
    >
      {badge.levelIndex ? (
        <div className="rounded px-1 text-xs font-semibold text-white">
          {toRomanNumeral(badge.levelIndex)}
        </div>
      ) : null}
      <Icon fill="currentColor" className={`size-5 text-white`} />
    </div>
  );
}
