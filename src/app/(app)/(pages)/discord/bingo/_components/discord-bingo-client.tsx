"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { BINGO_POLL_INTERVAL_MS } from "~/server/bingo/constants";
import type {
  BingoBoardCreatedPayload,
  BingoBoardView,
  BingoClaimInput,
  BingoCompletionPodiumEntry,
  BingoEventView,
  BingoEventsResponse,
  BingoLeaderboardRow,
} from "~/types/bingo";
import BingoBoardGrid from "./bingo-board-grid";
import BingoCompletionPodium from "./bingo-completion-podium";
import BingoConfettiLayer from "./bingo-confetti-layer";
import BingoLeaderboard from "./bingo-leaderboard";
import ClaimTileDialog from "./claim-tile-dialog";

const boardFetcher = async (url: string): Promise<BingoBoardView> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load board");
  return (await res.json()) as BingoBoardView;
};

const leaderboardFetcher = async (
  url: string,
): Promise<{
  boardId: string;
  rows: BingoLeaderboardRow[];
}> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load leaderboard");
  return (await res.json()) as { boardId: string; rows: BingoLeaderboardRow[] };
};

const eventsFetcher = async ([url, since]: [string, number]) => {
  const res = await fetch(`${url}?since=${since}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load events");
  return (await res.json()) as BingoEventsResponse;
};

const COMPLETION_COLLAPSE_MS = 220;
const COMPLETION_INTERSTITIAL_MS = 2_800;
const COMPLETION_FADE_IN_MS = 380;

type CompletionPhase =
  | "idle"
  | "collapse_out"
  | "completed_interstitial"
  | "fade_in_next";

function isCompletionBoardCreatedPayload(
  payload: unknown,
): payload is Extract<BingoBoardCreatedPayload, { source: "completion" }> {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  if (record.source !== "completion") return false;
  if (typeof record.previousBoardId !== "string") return false;
  return Array.isArray(record.previousLeaderboardTop3);
}

function isCompletionBoardCreatedEvent(
  event: BingoEventView,
): event is BingoEventView & {
  type: "board_created";
  payload: Extract<BingoBoardCreatedPayload, { source: "completion" }>;
} {
  return (
    event.type === "board_created" &&
    isCompletionBoardCreatedPayload(event.payload)
  );
}

function formatDuration(ms: number) {
  if (ms <= 0) return "0m";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function DiscordBingoClient(props: {
  canSkipCard: boolean;
  canCompleteCard: boolean;
}) {
  const { canSkipCard, canCompleteCard } = props;
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [discordMessageUrl, setDiscordMessageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkippingCard, setIsSkippingCard] = useState(false);
  const [isCompletingCard, setIsCompletingCard] = useState(false);
  const [eventCursor, setEventCursor] = useState(0);
  const [highlightTileIds, setHighlightTileIds] = useState<Set<string>>(
    new Set(),
  );
  const [confettiBursts, setConfettiBursts] = useState<
    Array<{ id: string; x: number; y: number }>
  >([]);
  const [optimisticTiles, setOptimisticTiles] = useState<Set<string>>(
    new Set(),
  );
  const [nowTick, setNowTick] = useState(Date.now());
  const [completionPhase, setCompletionPhase] =
    useState<CompletionPhase>("idle");
  const [completedBoardPodium, setCompletedBoardPodium] = useState<
    BingoCompletionPodiumEntry[]
  >([]);
  const [collapseBoard, setCollapseBoard] = useState<BingoBoardView | null>(
    null,
  );
  const [incomingBoard, setIncomingBoard] = useState<BingoBoardView | null>(
    null,
  );

  const boardSnapshotsRef = useRef<Map<string, BingoBoardView>>(new Map());
  const transitionTimersRef = useRef<number[]>([]);
  const lastHandledCompletionEventIdRef = useRef(0);
  const pendingCompletionRef = useRef<{
    id: number;
    payload: Extract<BingoBoardCreatedPayload, { source: "completion" }>;
  } | null>(null);

  function clearTransitionTimers() {
    for (const timer of transitionTimersRef.current) {
      window.clearTimeout(timer);
    }
    transitionTimersRef.current = [];
  }

  function startCompletionTransition(params: {
    eventId: number;
    payload: Extract<BingoBoardCreatedPayload, { source: "completion" }>;
    nextBoard: BingoBoardView;
  }) {
    const previousBoard =
      boardSnapshotsRef.current.get(params.payload.previousBoardId) ?? null;
    lastHandledCompletionEventIdRef.current = params.eventId;
    pendingCompletionRef.current = null;

    setCollapseBoard(previousBoard ?? params.nextBoard);
    setIncomingBoard(params.nextBoard);
    setCompletedBoardPodium(params.payload.previousLeaderboardTop3);
    setCompletionPhase("collapse_out");
    setSelectedTileId(null);
    setDiscordMessageUrl("");

    clearTransitionTimers();
    transitionTimersRef.current.push(
      window.setTimeout(() => {
        setCompletionPhase("completed_interstitial");
      }, COMPLETION_COLLAPSE_MS),
      window.setTimeout(() => {
        setCompletionPhase("fade_in_next");
      }, COMPLETION_INTERSTITIAL_MS),
      window.setTimeout(() => {
        setCompletionPhase("idle");
        setCollapseBoard(null);
        setIncomingBoard(null);
        setCompletedBoardPodium([]);
      }, COMPLETION_INTERSTITIAL_MS + COMPLETION_FADE_IN_MS),
    );
  }

  const { data: board, mutate: mutateBoard } = useSWR<BingoBoardView>(
    "/api/discord/bingo/board",
    boardFetcher,
    {
      refreshInterval: BINGO_POLL_INTERVAL_MS,
      revalidateOnFocus: false,
    },
  );

  const { data: leaderboard, mutate: mutateLeaderboard } = useSWR(
    "/api/discord/bingo/leaderboard",
    leaderboardFetcher,
    {
      refreshInterval: BINGO_POLL_INTERVAL_MS,
      revalidateOnFocus: false,
    },
  );

  const { data: events, mutate: mutateEvents } = useSWR(
    ["/api/discord/bingo/events", eventCursor] as [string, number],
    eventsFetcher,
    {
      refreshInterval: BINGO_POLL_INTERVAL_MS,
      revalidateOnFocus: false,
    },
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => clearTransitionTimers();
  }, []);

  useEffect(() => {
    if (!board) return;
    boardSnapshotsRef.current.set(board.id, board);
    while (boardSnapshotsRef.current.size > 5) {
      const firstKey = boardSnapshotsRef.current.keys().next().value;
      if (!firstKey) break;
      boardSnapshotsRef.current.delete(firstKey);
    }
  }, [board]);

  useEffect(() => {
    if (!events) return;
    if (events.nextCursor > eventCursor) setEventCursor(events.nextCursor);

    const latestCompletionCreatedEvent = [...events.events]
      .reverse()
      .find((event) => isCompletionBoardCreatedEvent(event));

    if (
      latestCompletionCreatedEvent &&
      latestCompletionCreatedEvent.id > lastHandledCompletionEventIdRef.current
    ) {
      const pending = pendingCompletionRef.current;
      if (!pending || latestCompletionCreatedEvent.id > pending.id) {
        pendingCompletionRef.current = {
          id: latestCompletionCreatedEvent.id,
          payload: latestCompletionCreatedEvent.payload,
        };
      }
    }

    const pendingCompletion = pendingCompletionRef.current;
    if (
      pendingCompletion &&
      board &&
      completionPhase === "idle" &&
      board.id !== pendingCompletion.payload.previousBoardId
    ) {
      startCompletionTransition({
        eventId: pendingCompletion.id,
        payload: pendingCompletion.payload,
        nextBoard: board,
      });
    }

    if (events.events.length === 0) {
      return;
    }

    const tileIds = events.events
      .filter((event) => event.type === "tile_completed" && event.boardTileId)
      .map((event) => event.boardTileId!);
    if (tileIds.length === 0) return;

    setHighlightTileIds((prev) => {
      const next = new Set(prev);
      for (const id of tileIds) next.add(id);
      return next;
    });

    for (const id of tileIds) {
      const tileNode = document.querySelector<HTMLElement>(
        `[data-bingo-tile-id="${id}"]`,
      );
      if (!tileNode) continue;
      const rect = tileNode.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      const px = x * window.innerWidth;
      const py = y * window.innerHeight;
      const burstId = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setConfettiBursts((prev) => [...prev, { id: burstId, x: px, y: py }]);
    }

    window.setTimeout(() => {
      setHighlightTileIds((prev) => {
        const next = new Set(prev);
        for (const id of tileIds) next.delete(id);
        return next;
      });
    }, 1500);
  }, [events, eventCursor, board, completionPhase]);

  useEffect(() => {
    if (!board) return;
    setEventCursor((prev) => Math.max(prev, board.lastEventCursor));
  }, [board]);

  useEffect(() => {
    if (!board) return;
    setOptimisticTiles((prev) => {
      const completed = new Set(
        board.tiles
          .filter((tile) => Boolean(tile.completedAt))
          .map((tile) => tile.id),
      );
      const next = new Set<string>();
      for (const id of prev) {
        if (!completed.has(id)) next.add(id);
      }
      return next;
    });
  }, [board]);

  const selectedTile = useMemo(
    () => board?.tiles.find((tile) => tile.id === selectedTileId) ?? null,
    [board, selectedTileId],
  );

  const remainingMs = useMemo(() => {
    if (!board?.expiresAt) return 0;
    return Math.max(0, new Date(board.expiresAt).getTime() - nowTick);
  }, [board?.expiresAt, nowTick]);

  const inactivityProgress = useMemo(() => {
    if (!board?.expiresAt || !board.inactivityDurationSeconds) return 100;
    const full = board.inactivityDurationSeconds * 1000;
    return Math.max(0, Math.min(100, (remainingMs / full) * 100));
  }, [board?.expiresAt, board?.inactivityDurationSeconds, remainingMs]);

  const hasStartedInactivityCountdown = Boolean(
    board?.status === "ACTIVE" && board.firstCompletedAt && board.expiresAt,
  );

  const boardForGrid = useMemo(() => {
    if (completionPhase === "collapse_out") return collapseBoard ?? board;
    if (completionPhase === "fade_in_next") return incomingBoard ?? board;
    return board;
  }, [board, collapseBoard, incomingBoard, completionPhase]);

  async function submitClaim() {
    if (!selectedTile || !discordMessageUrl.trim()) return;
    const claimedTileId = selectedTile.id;
    const payload: BingoClaimInput = {
      boardTileId: claimedTileId,
      discordMessageUrl: discordMessageUrl.trim(),
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/discord/bingo/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Failed to claim tile");

      setSelectedTileId(null);
      setDiscordMessageUrl("");
      // Apply visual state only after the modal has closed.
      window.setTimeout(() => {
        setOptimisticTiles((prev) => new Set(prev).add(claimedTileId));
      }, 180);
      toast.success("Tile claimed");
      await Promise.all([
        mutateBoard(),
        mutateLeaderboard(),
        mutateEvents(),
        globalMutate(
          (key) =>
            typeof key === "string" && key.includes("/api/discord/bingo"),
        ),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Claim failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function skipCard() {
    if (isSkippingCard || completionPhase !== "idle") return;
    setIsSkippingCard(true);
    try {
      const res = await fetch("/api/discord/bingo/skip", {
        method: "POST",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Failed to skip card");

      toast.success("Card skipped");
      await Promise.all([
        mutateBoard(),
        mutateLeaderboard(),
        mutateEvents(),
        globalMutate(
          (key) =>
            typeof key === "string" && key.includes("/api/discord/bingo"),
        ),
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to skip card",
      );
    } finally {
      setIsSkippingCard(false);
    }
  }

  async function completeCard() {
    if (isCompletingCard || completionPhase !== "idle") return;
    setIsCompletingCard(true);
    try {
      const res = await fetch("/api/discord/bingo/complete", {
        method: "POST",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Failed to complete card");

      toast.success("Card completed");
      await Promise.all([
        mutateBoard(),
        mutateLeaderboard(),
        mutateEvents(),
        globalMutate(
          (key) =>
            typeof key === "string" && key.includes("/api/discord/bingo"),
        ),
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete card",
      );
    } finally {
      setIsCompletingCard(false);
    }
  }

  return (
    <>
      <section className="grid min-h-0 grid-rows-[auto_1fr] gap-4 overflow-hidden">
        <div className="space-y-2">
          {(canSkipCard || canCompleteCard) && (
            <div className="flex items-center gap-2">
              {canSkipCard && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSkippingCard || completionPhase !== "idle"}
                  onClick={skipCard}
                >
                  Skip Card
                </Button>
              )}
              {canCompleteCard && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={isCompletingCard || completionPhase !== "idle"}
                  onClick={completeCard}
                >
                  Complete Card
                </Button>
              )}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {completionPhase === "completed_interstitial" ? (
            <motion.div
              key="completed-interstitial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid min-h-0 place-items-center overflow-hidden py-6"
            >
              <BingoCompletionPodium entries={completedBoardPodium} />
            </motion.div>
          ) : (
            <motion.div
              key={`board-${boardForGrid?.id ?? "none"}`}
              initial={
                completionPhase === "fade_in_next"
                  ? { opacity: 0, scale: 0.97 }
                  : { opacity: 1, scale: 1 }
              }
              animate={
                completionPhase === "collapse_out"
                  ? { opacity: 0, scale: 0.92 }
                  : { opacity: 1, scale: 1 }
              }
              exit={{ opacity: 0 }}
              transition={{
                duration:
                  completionPhase === "collapse_out"
                    ? COMPLETION_COLLAPSE_MS / 1000
                    : COMPLETION_FADE_IN_MS / 1000,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="grid min-h-0 grid-cols-[1fr_270px] gap-4 overflow-hidden"
            >
              <BingoBoardGrid
                board={boardForGrid ?? undefined}
                optimisticTiles={optimisticTiles}
                highlightTileIds={highlightTileIds}
                interactionLocked={completionPhase !== "idle"}
                onSelectTile={setSelectedTileId}
              />
              <BingoLeaderboard rows={leaderboard?.rows} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="flex items-center justify-between text-sm font-semibold">
        {hasStartedInactivityCountdown ? (
          <span>Board refresh in {formatDuration(remainingMs)}</span>
        ) : (
          <span />
        )}
        <span>
          {board?.completedCount ?? 0}/{board?.totalTiles ?? 25} completed
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Progress
          value={inactivityProgress}
          className="border-border/80 h-3 border"
        />
      </div>

      <BingoConfettiLayer
        bursts={confettiBursts}
        onBurstComplete={(id) => {
          setConfettiBursts((prev) => prev.filter((burst) => burst.id !== id));
        }}
      />

      <ClaimTileDialog
        board={board}
        selectedTileId={selectedTileId}
        discordMessageUrl={discordMessageUrl}
        isSubmitting={isSubmitting}
        onClose={() => {
          setSelectedTileId(null);
          setDiscordMessageUrl("");
        }}
        onUrlChange={setDiscordMessageUrl}
        onSubmit={submitClaim}
      />
    </>
  );
}
