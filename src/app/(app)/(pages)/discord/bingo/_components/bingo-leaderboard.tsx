"use client";

import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { BingoLeaderboardRow } from "~/types/bingo";

export default function BingoLeaderboard(props: {
  rows: BingoLeaderboardRow[] | undefined;
}) {
  const rows = props.rows ?? [];

  return (
    <aside className="min-h-0 overflow-hidden border-l border-border/70 pl-4">
      <h2 className="mb-2 text-xl font-extrabold uppercase">Leaderboard</h2>
      <div className="space-y-2 overflow-y-auto pr-1">
        {rows.length ? (
          rows.map((row) => (
            <motion.div
              key={row.userId}
              layout
              className="flex items-center justify-between border border-border/70 px-2 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="size-8">
                  <AvatarImage src={row.image ?? undefined} alt={row.name ?? "Player"} />
                  <AvatarFallback>
                    {(row.name ?? "?").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-semibold">
                  {row.name ?? "Community member"}
                </span>
              </div>
              <span className="text-lg font-extrabold tabular-nums">{row.points}</span>
            </motion.div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No scores yet.</p>
        )}
      </div>
    </aside>
  );
}
