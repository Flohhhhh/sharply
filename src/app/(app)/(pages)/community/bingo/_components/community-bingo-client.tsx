"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import useSWR from "swr";
import {
  actionArchiveCompletedCommunityBingoBoard,
  actionCreateNextCommunityBingoBoard,
  actionSubmitCommunityBingoTileClaim,
} from "~/server/community-bingo/actions";

type BoardResponse = Awaited<
  ReturnType<typeof import("~/server/community-bingo/service").fetchCommunityBingoBoard>
>;
type ActivityResponse = Awaited<
  ReturnType<
    typeof import("~/server/community-bingo/service").fetchCommunityBingoActivity
  >
>;

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
  return (await response.json()) as T;
};

function formatTimeLeft(ms: number) {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function eventLabel(eventType: string) {
  switch (eventType) {
    case "board_expiration_timer_started":
      return "Inactivity timer started";
    case "board_expiration_timer_extended":
      return "Inactivity timer extended";
    case "board_expired_inactivity":
      return "Board expired (inactivity)";
    case "board_completed":
      return "Board completed";
    default:
      return eventType;
  }
}

export function CommunityBingoClient({ initialData }: { initialData: BoardResponse }) {
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [discordMessageUrl, setDiscordMessageUrl] = useState("");
  const [note, setNote] = useState("");
  const [optimisticCompletedTileIds, setOptimisticCompletedTileIds] = useState<
    Set<string>
  >(new Set());
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const { data, mutate } = useSWR<BoardResponse>(
    "/api/community-bingo/board",
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 5000,
    },
  );

  const { data: activityData } = useSWR<ActivityResponse>(
    "/api/community-bingo/activity",
    fetcher,
    {
      refreshInterval: 4000,
    },
  );

  const tiles = data?.tiles ?? [];

  const effectiveCompletedTileIds = useMemo(() => {
    const completed = new Set(
      tiles.filter((tile) => tile.completedAt).map((tile) => tile.id),
    );
    for (const id of optimisticCompletedTileIds.values()) {
      completed.add(id);
    }
    return completed;
  }, [tiles, optimisticCompletedTileIds]);

  const selectedTile = tiles.find((tile) => tile.id === selectedTileId) ?? null;

  const canClaim =
    data?.board.status === "ACTIVE" &&
    !!selectedTile &&
    !effectiveCompletedTileIds.has(selectedTile.id) &&
    Boolean(discordMessageUrl.trim()) &&
    !isPending;

  const inactivityWindowMs = data?.inactivityWindowMs ?? 0;
  const inactivityExpiresAt = data?.board.inactivityExpiresAt
    ? new Date(data.board.inactivityExpiresAt).getTime()
    : null;
  const remainingMs = inactivityExpiresAt ? Math.max(0, inactivityExpiresAt - nowTs) : null;
  const inactivityProgress =
    remainingMs !== null && inactivityWindowMs > 0
      ? Math.min(100, Math.max(0, (remainingMs / inactivityWindowMs) * 100))
      : 0;

  const statusPillClass =
    data?.board.status === "COMPLETED"
      ? "bg-emerald-500/15 text-emerald-300"
      : data?.board.status === "EXPIRED"
        ? "bg-amber-500/15 text-amber-300"
        : data?.board.status === "ARCHIVED"
          ? "bg-zinc-500/20 text-zinc-300"
          : "bg-primary/10 text-primary animate-pulse";

  function handleSubmitClaim() {
    if (!selectedTileId || !canClaim) return;

    setFeedback(null);
    setOptimisticCompletedTileIds((previous) => {
      const next = new Set(previous);
      next.add(selectedTileId);
      return next;
    });

    startTransition(async () => {
      try {
        await actionSubmitCommunityBingoTileClaim({
          tileId: selectedTileId,
          discordMessageUrl,
          note: note.trim() || undefined,
        });
        setDiscordMessageUrl("");
        setNote("");
        setFeedback("Tile claimed! +10 points ✨");
        await mutate();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Failed to claim tile");
      } finally {
        setOptimisticCompletedTileIds((previous) => {
          const next = new Set(previous);
          next.delete(selectedTileId);
          return next;
        });
      }
    });
  }

  function handleArchiveBoard() {
    if (!data?.board?.id || isPending) return;
    startTransition(async () => {
      try {
        await actionArchiveCompletedCommunityBingoBoard(data.board.id);
        await mutate();
        setFeedback("Board archived. Ready for a fresh card!");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Failed to archive board");
      }
    });
  }

  function handleCreateBoard() {
    if (isPending) return;
    startTransition(async () => {
      try {
        await actionCreateNextCommunityBingoBoard();
        await mutate();
        setFeedback("New board created. Let the chaos begin 🎉");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Failed to create board");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{data?.board.title}</p>
              <p className="text-xs text-muted-foreground">
                {data?.progress.completedTiles}/{data?.progress.totalTiles} tiles complete
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass}`}>
              {data?.board.status}
            </span>
          </div>

          <div className="mb-4 rounded-md border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium">Inactivity window</span>
              <span>
                {remainingMs === null
                  ? "Starts after the first completed tile"
                  : formatTimeLeft(remainingMs)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${
                  remainingMs !== null && remainingMs < 1000 * 60 * 10
                    ? "bg-amber-500"
                    : "bg-primary"
                }`}
                style={{ width: `${inactivityProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {data?.board.status === "EXPIRED"
                ? "This board expired due to inactivity. Start a new board anytime."
                : "Each completed tile resets this timer. If time runs out, the board expires due to inactivity."}
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {tiles.map((tile) => {
              const isDone = effectiveCompletedTileIds.has(tile.id);
              const isSelected = selectedTileId === tile.id;

              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => setSelectedTileId(tile.id)}
                  className={`aspect-square rounded-md border p-2 text-left text-xs transition-all ${
                    isDone
                      ? "border-emerald-500 bg-emerald-500/20"
                      : "border-border hover:border-primary/50"
                  } ${isSelected ? "ring-2 ring-primary" : ""} ${
                    isDone ? "animate-[pulse_1.8s_ease-in-out_infinite]" : ""
                  }`}
                >
                  <span className="line-clamp-4">{tile.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Claim selected tile</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Add a Discord message link as proof. Validation runs through one shared checker
            before claim completion.
          </p>

          <div className="space-y-2">
            <input
              value={discordMessageUrl}
              onChange={(event) => setDiscordMessageUrl(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="https://discord.com/channels/<guild>/<channel>/<message>"
            />
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Optional note for context"
              rows={2}
            />
            <button
              type="button"
              onClick={handleSubmitClaim}
              disabled={!canClaim}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "Claiming..." : "Claim tile (+10)"}
            </button>
          </div>

          {selectedTile?.proof ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Existing proof: {" "}
              <a className="underline" href={selectedTile.proof.discordMessageUrl}>
                {selectedTile.proof.discordMessageUrl}
              </a>
            </p>
          ) : null}

          {feedback ? <p className="mt-3 text-sm">{feedback}</p> : null}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">Leaderboard</h3>
          <ul className="space-y-2 text-sm">
            {data?.leaderboard.map((entry, index) => (
              <li key={entry.id} className="flex items-center justify-between">
                <span>
                  #{index + 1} {entry.userHandle ?? entry.userName ?? "Anonymous"}
                </span>
                <span className="font-semibold">{entry.points} pts</span>
              </li>
            ))}
            {!data?.leaderboard.length ? (
              <li className="text-xs text-muted-foreground">No points yet.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">Recent activity</h3>
          <ul className="space-y-2 text-xs">
            {activityData?.events.map((event) => (
              <li
                key={event.id}
                className={`rounded-md p-2 animate-in fade-in duration-500 ${
                  event.eventType === "board_expired_inactivity"
                    ? "bg-amber-500/15"
                    : event.eventType === "board_completed"
                      ? "bg-emerald-500/15"
                      : "bg-muted/60"
                }`}
              >
                <p className="font-medium">{eventLabel(event.eventType)}</p>
                <p className="text-muted-foreground">
                  by {event.actorHandle ?? event.actorName ?? "system"}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">Board controls</h3>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm"
              disabled={data?.board.status !== "COMPLETED" || isPending}
              onClick={handleArchiveBoard}
            >
              Archive completed board
            </button>
            <button
              type="button"
              className="rounded-md bg-secondary px-3 py-2 text-sm"
              disabled={data?.board.status === "ACTIVE" || isPending}
              onClick={handleCreateBoard}
            >
              Start a new board
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
