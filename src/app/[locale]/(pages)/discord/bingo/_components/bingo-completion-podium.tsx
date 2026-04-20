"use client";

import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { BingoCompletionPodiumEntry } from "~/types/bingo";

type RankStyles = {
  wrapper: string;
  avatar: string;
  name: string;
  points: string;
  medal: string;
  opacity: string;
};

const RANK_STYLES: Record<BingoCompletionPodiumEntry["rank"], RankStyles> = {
  1: {
    wrapper: "text-foreground",
    avatar: "size-14",
    name: "text-2xl",
    points: "text-4xl",
    medal: "bg-amber-500",
    opacity: "opacity-100",
  },
  2: {
    wrapper: "text-foreground/90",
    avatar: "size-11",
    name: "text-xl",
    points: "text-3xl",
    medal: "bg-slate-300",
    opacity: "opacity-80",
  },
  3: {
    wrapper: "text-foreground/80",
    avatar: "size-9",
    name: "text-lg",
    points: "text-2xl",
    medal: "bg-amber-700",
    opacity: "opacity-60",
  },
};

export default function BingoCompletionPodium(props: {
  entries: BingoCompletionPodiumEntry[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center justify-center gap-4">
      <h2 className="text-center text-5xl leading-none font-black tracking-tight uppercase">
        CARD COMPLETED!
      </h2>
      {props.entries.length ? (
        <div className="w-full space-y-3">
          {props.entries.map((entry, index) => {
            const styles = RANK_STYLES[entry.rank];
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.22 }}
                className={`border-border/70 flex items-center justify-between border px-3 py-2 ${styles.wrapper} ${styles.opacity}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`size-3 rounded-full ${styles.medal}`}
                    aria-hidden="true"
                  />
                  <Avatar className={styles.avatar}>
                    <AvatarImage
                      src={entry.image ?? undefined}
                      alt={entry.name ?? `Rank ${entry.rank}`}
                    />
                    <AvatarFallback>
                      {(entry.name ?? "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className={`${styles.name} truncate font-extrabold`}>
                      {entry.name ?? "Community member"}
                    </p>
                    <p className="text-xs font-bold uppercase">Rank {entry.rank}</p>
                  </div>
                </div>
                <p className={`${styles.points} font-black tabular-nums`}>
                  {entry.points}
                </p>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm font-bold uppercase">
          No leaderboard data from the completed board.
        </p>
      )}
    </div>
  );
}
