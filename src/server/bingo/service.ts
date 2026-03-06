import "server-only";

import { db } from "~/server/db";
import { getSessionOrThrow } from "~/server/auth";
import { z } from "zod";
import { requireRole } from "~/lib/auth/auth-helpers";
import { env } from "~/env";
import {
  BINGO_DEFAULT_INACTIVITY_SECONDS,
  BINGO_FREE_TILE_INDEX,
  BINGO_FREE_TILE_LABEL,
  BINGO_TEMPLATE_LABELS,
  BINGO_TILE_COUNT,
} from "./constants";
import {
  createBingoEventData,
  createBoardData,
  createSubmissionData,
  fetchActiveBoardData,
  fetchBoardByIdData,
  fetchBoardEventsSinceData,
  fetchBoardLeaderboardData,
  fetchBoardTileByIdData,
  fetchBoardTileShapeData,
  fetchBoardTilesWithProofData,
  fetchCompletedTilePositionsData,
  fetchLastEventCursorData,
  incrementScoreData,
  insertBoardTilesData,
  markBoardCompletedData,
  markBoardExpiredData,
  completeTileIfOpenData,
  updateBoardInactivityData,
} from "./data";
import {
  CheckSubmissionValidity,
  parseDiscordMessageUrl,
  type CheckSubmissionValidityInput,
} from "./validation";
import {
  calculateInactivityExpiry,
  hasBingoLine,
  shouldExpireForInactivity,
} from "./lifecycle";
import { createBoardCreatedPayload } from "./events";
import { isBoardTileShapeValid, selectBoardLabels } from "./template";
import type {
  BingoBoardCreatedPayload,
  BingoBoardView,
  BingoClaimInput,
  BingoEventView,
  BingoEventsResponse,
  BingoLeaderboardRow,
} from "~/types/bingo";

const claimInputSchema = z.object({
  boardTileId: z.string().min(1),
  discordMessageUrl: z.string().url().min(1),
});

function buildBoardLabels() {
  return selectBoardLabels({
    templateLabels: BINGO_TEMPLATE_LABELS,
    tileCount: BINGO_TILE_COUNT,
    freeTileIndex: BINGO_FREE_TILE_INDEX,
    freeTileLabel: BINGO_FREE_TILE_LABEL,
  });
}

async function createBoardFromTemplate(params: {
  createdByUserId?: string | null;
  inactivityDurationSeconds?: number;
}) {
  return db.transaction(async (tx) => {
    const board = await createBoardData(
      {
        createdByUserId: params.createdByUserId ?? null,
        inactivityDurationSeconds:
          params.inactivityDurationSeconds ?? BINGO_DEFAULT_INACTIVITY_SECONDS,
      },
      tx,
    );
    if (!board) throw new Error("Failed to create board");

    await insertBoardTilesData(board.id, buildBoardLabels(), BINGO_FREE_TILE_INDEX, tx);

    await createBingoEventData(
      {
        type: "board_created",
        boardId: board.id,
        userId: params.createdByUserId ?? null,
        payload: createBoardCreatedPayload({
          source: "initial",
        }),
      },
      tx,
    );

    return board;
  });
}

async function expireBoardAndCreateNext(params: {
  boardId: string;
  now: Date;
  userId?: string | null;
  reason?: "inactivity_timeout" | "admin_skip" | "invalid_shape";
}) {
  return db.transaction(async (tx) => {
    const expired = await markBoardExpiredData(
      { boardId: params.boardId, at: params.now },
      tx,
    );

    if (expired) {
      await createBingoEventData(
        {
          type: "board_expired",
          boardId: params.boardId,
          userId: params.userId ?? null,
          payload: {
            at: params.now.toISOString(),
            reason: params.reason ?? "inactivity_timeout",
          },
        },
        tx,
      );
    }

    const nextBoard = await createBoardData(
      {
        createdByUserId: null,
        inactivityDurationSeconds: BINGO_DEFAULT_INACTIVITY_SECONDS,
      },
      tx,
    );
    if (!nextBoard) throw new Error("Failed to rotate board");

    await insertBoardTilesData(
      nextBoard.id,
      buildBoardLabels(),
      BINGO_FREE_TILE_INDEX,
      tx,
    );
    await createBingoEventData(
      {
        type: "board_created",
        boardId: nextBoard.id,
        userId: params.userId ?? null,
        payload: createBoardCreatedPayload({
          source: "inactivity",
          previousBoardId: params.boardId,
        }),
      },
      tx,
    );
    return nextBoard;
  });
}

async function ensureActiveBoard() {
  const now = new Date();
  let board = await fetchActiveBoardData();
  if (!board) {
    board = await createBoardFromTemplate({ createdByUserId: null });
    return board;
  }

  if (
    shouldExpireForInactivity({
      now,
      firstCompletedAt: board.firstCompletedAt,
      expiresAt: board.expiresAt,
    })
  ) {
    return expireBoardAndCreateNext({
      boardId: board.id,
      now,
      reason: "inactivity_timeout",
    });
  }

  const boardShape = await fetchBoardTileShapeData(board.id);
  if (
    !isBoardTileShapeValid({
      tileCount: BINGO_TILE_COUNT,
      freeTileIndex: BINGO_FREE_TILE_INDEX,
      tiles: boardShape,
    })
  ) {
    return expireBoardAndCreateNext({
      boardId: board.id,
      now,
      reason: "invalid_shape",
    });
  }

  return board;
}

async function toBoardView(boardId: string): Promise<BingoBoardView> {
  const board = await fetchBoardByIdData(boardId);
  if (!board) throw Object.assign(new Error("Board not found"), { status: 404 });

  const [tiles, lastEventCursor] = await Promise.all([
    fetchBoardTilesWithProofData(board.id),
    fetchLastEventCursorData(board.id),
  ]);

  const completedCount = tiles.filter((tile) => Boolean(tile.completedAt)).length;

  return {
    id: board.id,
    status: board.status,
    inactivityDurationSeconds: board.inactivityDurationSeconds,
    expiresAt: board.expiresAt ? board.expiresAt.toISOString() : null,
    firstCompletedAt: board.firstCompletedAt
      ? board.firstCompletedAt.toISOString()
      : null,
    completedAt: board.completedAt ? board.completedAt.toISOString() : null,
    expiredAt: board.expiredAt ? board.expiredAt.toISOString() : null,
    endReason: board.endReason ?? null,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
    completedCount,
    totalTiles: tiles.length,
    lastEventCursor,
    tiles: tiles.map((tile) => ({
      id: tile.id,
      position: tile.position,
      label: tile.label,
      isFreeTile: tile.isFreeTile,
      completedAt: tile.completedAt ? tile.completedAt.toISOString() : null,
      completedBy: tile.completedById
        ? {
            id: tile.completedById,
            name: tile.completedByName,
            image: tile.completedByImage,
          }
        : null,
      submission: tile.submissionId
        ? {
            id: tile.submissionId,
            discordMessageUrl: tile.submissionUrl ?? "",
            discordGuildId: tile.submissionGuildId ?? null,
            discordChannelId: tile.submissionChannelId ?? null,
            discordMessageId: tile.submissionMessageId ?? null,
            createdAt: tile.submissionCreatedAt?.toISOString() ?? "",
          }
        : null,
    })),
  };
}

export async function getActiveBoardState(): Promise<BingoBoardView> {
  const board = await ensureActiveBoard();
  return toBoardView(board.id);
}

export async function getActiveBoardLeaderboard(): Promise<{
  boardId: string;
  rows: BingoLeaderboardRow[];
}> {
  const board = await ensureActiveBoard();
  const rows = await fetchBoardLeaderboardData(board.id);
  return {
    boardId: board.id,
    rows: rows.map((row) => ({
      userId: row.userId,
      points: row.points,
      name: row.name,
      image: row.image,
    })),
  };
}

export async function getActiveBoardEventsSince(
  since: number,
): Promise<BingoEventsResponse> {
  const board = await ensureActiveBoard();
  const events = await fetchBoardEventsSinceData({
    boardId: board.id,
    since,
    limit: 100,
  });
  const nextCursor = events.length ? events[events.length - 1]!.id : since;
  return {
    boardId: board.id,
    events: events.map((event) => {
      const base = {
        id: event.id,
        boardId: event.boardId,
        boardTileId: event.boardTileId,
        submissionId: event.submissionId,
        userId: event.userId,
        createdAt: event.createdAt.toISOString(),
      };

      if (event.type === "board_created") {
        return {
          ...base,
          type: "board_created",
          payload: (event.payload ?? null) as BingoBoardCreatedPayload | null,
        } satisfies BingoEventView;
      }

      return {
        ...base,
        type: event.type,
        payload: (event.payload ?? null) as Record<string, unknown> | null,
      } satisfies BingoEventView;
    }),
    nextCursor,
  };
}

export async function createNextBoardFromTemplate(options?: {
  createdByUserId?: string | null;
}) {
  return createBoardFromTemplate({
    createdByUserId: options?.createdByUserId ?? null,
  });
}

export async function claimTileWithSubmission(inputRaw: BingoClaimInput) {
  const input = claimInputSchema.parse(inputRaw);
  const { user } = await getSessionOrThrow();
  const board = await ensureActiveBoard();
  const tile = await fetchBoardTileByIdData(input.boardTileId);
  if (tile?.boardId !== board.id) {
    throw Object.assign(new Error("Tile is not part of the active board"), {
      status: 400,
    });
  }
  if (tile.isFreeTile) {
    throw Object.assign(new Error("Free tile cannot be manually claimed"), {
      status: 400,
    });
  }

  const parsedLink = parseDiscordMessageUrl(input.discordMessageUrl);
  const validationInput: CheckSubmissionValidityInput = {
    boardTileId: input.boardTileId,
    discordMessageUrl: input.discordMessageUrl,
    boardIsActive: board.status === "ACTIVE",
    tileCompletedAt: tile.completedAt,
  };
  if (!parsedLink || !CheckSubmissionValidity(validationInput)) {
    throw Object.assign(new Error("Invalid submission"), { status: 400 });
  }

  const now = new Date();
  const result = await db.transaction(async (tx) => {
    const currentBoard = await fetchBoardByIdData(board.id, tx);
    if (currentBoard?.status !== "ACTIVE") {
      throw Object.assign(new Error("Board is not active"), { status: 409 });
    }
    if (
      shouldExpireForInactivity({
        now,
        firstCompletedAt: currentBoard.firstCompletedAt,
        expiresAt: currentBoard.expiresAt,
      })
    ) {
      throw Object.assign(new Error("Board expired"), { status: 409 });
    }

    const submission = await createSubmissionData(
      {
        boardId: board.id,
        boardTileId: input.boardTileId,
        userId: user.id,
        discordMessageUrl: input.discordMessageUrl,
        discordGuildId: parsedLink.guildId,
        discordChannelId: parsedLink.channelId,
        discordMessageId: parsedLink.messageId,
        validationPassed: true,
      },
      tx,
    );

    if (!submission) {
      throw Object.assign(new Error("Failed to create submission"), {
        status: 500,
      });
    }

    const completedTile = await completeTileIfOpenData(
      {
        boardId: board.id,
        boardTileId: input.boardTileId,
        completedByUserId: user.id,
        submissionId: submission.id,
        completedAt: now,
      },
      tx,
    );
    if (!completedTile) {
      throw Object.assign(new Error("Tile already completed"), { status: 409 });
    }

    const score = await incrementScoreData(
      { boardId: board.id, userId: user.id, incrementBy: 1 },
      tx,
    );

    await createBingoEventData(
      {
        type: "submission_created",
        boardId: board.id,
        boardTileId: input.boardTileId,
        submissionId: submission.id,
        userId: user.id,
      },
      tx,
    );
    await createBingoEventData(
      {
        type: "tile_completed",
        boardId: board.id,
        boardTileId: input.boardTileId,
        submissionId: submission.id,
        userId: user.id,
      },
      tx,
    );
    await createBingoEventData(
      {
        type: "score_updated",
        boardId: board.id,
        userId: user.id,
        payload: { points: score?.points ?? 1 },
      },
      tx,
    );

    const firstCompletedAt = currentBoard.firstCompletedAt ?? now;
    const expiresAt = calculateInactivityExpiry(
      now,
      currentBoard.inactivityDurationSeconds,
    );
    await updateBoardInactivityData(
      { boardId: board.id, firstCompletedAt, expiresAt },
      tx,
    );
    await createBingoEventData(
      {
        type: currentBoard.firstCompletedAt
          ? "inactivity_timer_extended"
          : "inactivity_timer_started",
        boardId: board.id,
        userId: user.id,
        boardTileId: input.boardTileId,
        payload: {
          expiresAt: expiresAt.toISOString(),
        },
      },
      tx,
    );

    const completedTilePositions = await fetchCompletedTilePositionsData(
      board.id,
      tx,
    );
    const hasWinningLine = hasBingoLine(completedTilePositions);

    let rotatedBoardId: string | null = null;
    if (hasWinningLine) {
      const completedBoard = await markBoardCompletedData(
        { boardId: board.id, at: now },
        tx,
      );
      if (completedBoard) {
        await createBingoEventData(
          {
            type: "board_completed",
            boardId: board.id,
            userId: user.id,
            payload: { completedAt: now.toISOString() },
          },
          tx,
        );
        const completedBoardLeaderboard = await fetchBoardLeaderboardData(
          board.id,
          tx,
        );

        const nextBoard = await createBoardData(
          {
            createdByUserId: user.id,
            inactivityDurationSeconds: BINGO_DEFAULT_INACTIVITY_SECONDS,
          },
          tx,
        );
        if (!nextBoard) throw new Error("Failed to rotate completed board");
        await insertBoardTilesData(
          nextBoard.id,
          buildBoardLabels(),
          BINGO_FREE_TILE_INDEX,
          tx,
        );
        await createBingoEventData(
          {
            type: "board_created",
            boardId: nextBoard.id,
            userId: user.id,
            payload: createBoardCreatedPayload({
              source: "completion",
              previousBoardId: board.id,
              leaderboardRows: completedBoardLeaderboard,
            }),
          },
          tx,
        );
        rotatedBoardId = nextBoard.id;
      }
    }

    return {
      boardId: board.id,
      rotatedBoardId,
      tileId: completedTile.id,
      submissionId: submission.id,
    };
  });

  return result;
}

export async function skipActiveBingoBoardByAdmin() {
  const { user } = await getSessionOrThrow();
  if (!requireRole(user, ["ADMIN"])) {
    throw Object.assign(new Error("Admin only"), { status: 403 });
  }

  const board = await ensureActiveBoard();
  const now = new Date();
  const nextBoard = await expireBoardAndCreateNext({
    boardId: board.id,
    now,
    userId: user.id,
    reason: "admin_skip",
  });

  return {
    skippedBoardId: board.id,
    nextBoardId: nextBoard.id,
  };
}

export async function completeActiveBingoBoardForDevelopment() {
  if (env.NODE_ENV !== "development") {
    throw Object.assign(
      new Error("Complete card is available in development only"),
      { status: 403 },
    );
  }

  const { user } = await getSessionOrThrow();
  const board = await ensureActiveBoard();
  const now = new Date();

  return db.transaction(async (tx) => {
    const currentBoard = await fetchBoardByIdData(board.id, tx);
    if (currentBoard?.status !== "ACTIVE") {
      throw Object.assign(new Error("Board is not active"), { status: 409 });
    }

    const completedBoard = await markBoardCompletedData(
      { boardId: board.id, at: now },
      tx,
    );
    if (!completedBoard) {
      throw Object.assign(new Error("Board already ended"), { status: 409 });
    }

    await createBingoEventData(
      {
        type: "board_completed",
        boardId: board.id,
        userId: user.id,
        payload: { completedAt: now.toISOString(), reason: "development_manual" },
      },
      tx,
    );

    const completedBoardLeaderboard = await fetchBoardLeaderboardData(board.id, tx);

    const nextBoard = await createBoardData(
      {
        createdByUserId: user.id,
        inactivityDurationSeconds: BINGO_DEFAULT_INACTIVITY_SECONDS,
      },
      tx,
    );
    if (!nextBoard) throw new Error("Failed to rotate completed board");

    await insertBoardTilesData(
      nextBoard.id,
      buildBoardLabels(),
      BINGO_FREE_TILE_INDEX,
      tx,
    );

    await createBingoEventData(
      {
        type: "board_created",
        boardId: nextBoard.id,
        userId: user.id,
        payload: createBoardCreatedPayload({
          source: "completion",
          previousBoardId: board.id,
          leaderboardRows: completedBoardLeaderboard,
        }),
      },
      tx,
    );

    return {
      completedBoardId: board.id,
      nextBoardId: nextBoard.id,
    };
  });
}
