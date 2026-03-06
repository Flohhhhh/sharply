import "server-only";

import { headers } from "next/headers";
import { auth } from "~/auth";
import {
  completeTileData,
  createBoardData,
  createEventData,
  createSubmissionData,
  createTilesData,
  fetchBoardByIdData,
  fetchBoardProgressData,
  fetchLeaderboardByBoardIdData,
  fetchMostRecentBoardData,
  fetchRecentEventsData,
  fetchSubmissionByTileIdData,
  fetchTileByIdData,
  fetchTilesByBoardIdData,
  updateBoardInactivityExpiryData,
  updateBoardStatusData,
  upsertScoreData,
} from "./data";
import { tiles as DEFAULT_BOARD_TILES } from "./tiles";
import { CheckSubmissionValidity } from "./validation";

const TILE_POINTS = 10;
const BOARD_INACTIVITY_WINDOW_MS = 1000 * 60 * 60 * 24;

async function getSessionUserOrThrow() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return session.user;
}

function calculateInactivityExpiry(now = new Date()) {
  return new Date(now.getTime() + BOARD_INACTIVITY_WINDOW_MS);
}

async function maybeExpireBoardForInactivity(
  board: Awaited<ReturnType<typeof fetchBoardByIdData>>,
) {
  if (board?.status !== "ACTIVE" || !board.inactivityExpiresAt) {
    return board;
  }

  const now = new Date();
  if (board.inactivityExpiresAt > now) return board;

  const expiredBoard = await updateBoardStatusData({
    boardId: board.id,
    status: "EXPIRED",
  });

  await createEventData({
    boardId: board.id,
    eventType: "board_expired_inactivity",
    metadata: {
      expiredAt: now.toISOString(),
      inactivityExpiresAt: board.inactivityExpiresAt.toISOString(),
    },
  });

  return expiredBoard;
}

async function ensureBoardForRead() {
  const latest = await fetchMostRecentBoardData();
  if (!latest) {
    const created = await createBoardData({
      title: "Community Bingo #1",
    });

    if (!created) {
      throw new Error("Failed to create board");
    }

    await createTilesData(created.id, DEFAULT_BOARD_TILES);
    await createEventData({
      boardId: created.id,
      eventType: "new_board_created",
      metadata: { title: created.title },
    });

    return created;
  }

  const maybeExpired = await maybeExpireBoardForInactivity(latest);
  if (!maybeExpired) {
    throw new Error("Unable to load board");
  }

  return maybeExpired;
}

async function getBoardForArchiveFlow(boardId: string) {
  const board = await fetchBoardByIdData(boardId);
  if (!board) {
    throw Object.assign(new Error("Board not found."), { status: 404 });
  }

  return maybeExpireBoardForInactivity(board);
}

async function getBoardPayload(boardId: string) {
  const [tiles, leaderboard, progress] = await Promise.all([
    fetchTilesByBoardIdData(boardId),
    fetchLeaderboardByBoardIdData(boardId),
    fetchBoardProgressData(boardId),
  ]);

  const proofByTile = new Map<
    string,
    Awaited<ReturnType<typeof fetchSubmissionByTileIdData>>
  >();

  await Promise.all(
    tiles
      .filter((tile) => tile.completedAt)
      .map(async (tile) => {
        const submission = await fetchSubmissionByTileIdData(tile.id);
        proofByTile.set(tile.id, submission);
      }),
  );

  return {
    tiles: tiles.map((tile) => ({
      ...tile,
      proof: proofByTile.get(tile.id)
        ? {
            submittedById: proofByTile.get(tile.id)?.submittedById,
            discordMessageUrl: proofByTile.get(tile.id)?.discordMessageUrl,
            note: proofByTile.get(tile.id)?.note,
            createdAt: proofByTile.get(tile.id)?.createdAt,
          }
        : null,
    })),
    leaderboard,
    progress,
  };
}

export async function fetchCommunityBingoBoard() {
  const board = await ensureBoardForRead();
  const payload = await getBoardPayload(board.id);

  return {
    board,
    inactivityWindowMs: BOARD_INACTIVITY_WINDOW_MS,
    ...payload,
  };
}

export async function fetchCommunityBingoActivity(after?: string) {
  const board = await ensureBoardForRead();
  const events = await fetchRecentEventsData({ boardId: board.id, after, limit: 40 });
  return {
    boardId: board.id,
    events,
  };
}

export async function submitCommunityBingoTileClaim(params: {
  tileId: string;
  discordMessageUrl: string;
  note?: string;
}) {
  const user = await getSessionUserOrThrow();
  const board = await ensureBoardForRead();

  if (board.status !== "ACTIVE") {
    throw Object.assign(new Error("Active board is not available."), {
      status: 409,
    });
  }

  const tile = await fetchTileByIdData(params.tileId);
  if (tile?.boardId !== board.id) {
    throw Object.assign(new Error("Tile not found on active board."), {
      status: 404,
    });
  }

  const validation = await CheckSubmissionValidity({
    tile,
    discordMessageUrl: params.discordMessageUrl,
    note: params.note,
  });

  if (!validation.isValid || !validation.parsedDiscordIds) {
    throw Object.assign(new Error(validation.reason ?? "Invalid submission."), {
      status: 400,
    });
  }

  const submission = await createSubmissionData({
    boardId: board.id,
    tileId: tile.id,
    submittedById: user.id,
    discordMessageUrl: params.discordMessageUrl,
    discordGuildId: validation.parsedDiscordIds.guildId,
    discordChannelId: validation.parsedDiscordIds.channelId,
    discordMessageId: validation.parsedDiscordIds.messageId,
    note: params.note,
  });

  if (!submission) {
    throw new Error("Failed to store submission.");
  }

  const completedTile = await completeTileData({
    tileId: tile.id,
    userId: user.id,
    proofSubmissionId: submission.id,
  });

  if (!completedTile) {
    throw Object.assign(new Error("Tile has already been claimed."), {
      status: 409,
    });
  }

  const expiryBefore = board.inactivityExpiresAt;
  const nextExpiry = calculateInactivityExpiry();
  await updateBoardInactivityExpiryData({
    boardId: board.id,
    inactivityExpiresAt: nextExpiry,
  });

  await createEventData({
    boardId: board.id,
    actorUserId: user.id,
    tileId: tile.id,
    eventType: expiryBefore
      ? "board_expiration_timer_extended"
      : "board_expiration_timer_started",
    metadata: {
      previousExpiry: expiryBefore?.toISOString() ?? null,
      inactivityExpiresAt: nextExpiry.toISOString(),
      inactivityWindowMs: BOARD_INACTIVITY_WINDOW_MS,
    },
  });

  const score = await upsertScoreData({
    boardId: board.id,
    userId: user.id,
    pointsDelta: TILE_POINTS,
    claimsDelta: 1,
  });

  await createEventData({
    boardId: board.id,
    tileId: tile.id,
    actorUserId: user.id,
    eventType: "submission_created",
    metadata: {
      discordMessageUrl: params.discordMessageUrl,
    },
  });

  await createEventData({
    boardId: board.id,
    tileId: tile.id,
    actorUserId: user.id,
    eventType: "tile_completed",
    metadata: {
      tileLabel: tile.label,
      awardedPoints: TILE_POINTS,
    },
  });

  await createEventData({
    boardId: board.id,
    actorUserId: user.id,
    eventType: "score_changed",
    metadata: {
      points: score?.points ?? TILE_POINTS,
      delta: TILE_POINTS,
    },
  });

  const progress = await fetchBoardProgressData(board.id);
  if (progress.totalTiles > 0 && progress.totalTiles === progress.completedTiles) {
    await updateBoardStatusData({
      boardId: board.id,
      status: "COMPLETED",
    });

    await createEventData({
      boardId: board.id,
      actorUserId: user.id,
      eventType: "board_completed",
      metadata: {
        totalTiles: progress.totalTiles,
      },
    });
  }

  return {
    ok: true,
  };
}

export async function archiveCompletedCommunityBingoBoard(boardId: string) {
  const user = await getSessionUserOrThrow();
  const board = await getBoardForArchiveFlow(boardId);

  if (board?.status !== "COMPLETED") {
    throw Object.assign(new Error("Board must be completed before archiving."), {
      status: 400,
    });
  }

  await updateBoardStatusData({
    boardId: board.id,
    status: "ARCHIVED",
  });

  await createEventData({
    boardId: board.id,
    actorUserId: user.id,
    eventType: "board_archived",
  });

  return { ok: true };
}

export async function createNextCommunityBingoBoard(params?: { title?: string }) {
  const user = await getSessionUserOrThrow();
  const latest = await ensureBoardForRead();

  if (latest.status === "ACTIVE") {
    throw Object.assign(
      new Error("Current board is still active. Finish, expire, or archive it first."),
      { status: 400 },
    );
  }

  const created = await createBoardData({
    title: params?.title?.trim() || `Community Bingo ${new Date().toLocaleDateString()}`,
    createdById: user.id,
  });

  if (!created) {
    throw new Error("Failed to create next board.");
  }

  await createTilesData(created.id, DEFAULT_BOARD_TILES);
  await createEventData({
    boardId: created.id,
    actorUserId: user.id,
    eventType: "new_board_created",
    metadata: {
      title: created.title,
    },
  });

  return { ok: true, boardId: created.id };
}
