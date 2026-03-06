import "server-only";

import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  bingoBoardTiles,
  bingoBoards,
  bingoEvents,
  bingoScores,
  bingoSubmissions,
  users,
  type bingoEventTypeEnum,
} from "~/server/db/schema";

export type BingoEventTypeDb = (typeof bingoEventTypeEnum.enumValues)[number];
export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbLike = typeof db | DbTx;

export async function fetchActiveBoardData(conn: DbLike = db) {
  return conn.query.bingoBoards.findFirst({
    where: eq(bingoBoards.status, "ACTIVE"),
    orderBy: [desc(bingoBoards.createdAt)],
  });
}

export async function fetchBoardByIdData(boardId: string, conn: DbLike = db) {
  return conn.query.bingoBoards.findFirst({
    where: eq(bingoBoards.id, boardId),
  });
}

export async function createBoardData(
  params: {
    createdByUserId?: string | null;
    inactivityDurationSeconds: number;
  },
  conn: DbLike = db,
) {
  const rows = await conn
    .insert(bingoBoards)
    .values({
      createdByUserId: params.createdByUserId ?? null,
      inactivityDurationSeconds: params.inactivityDurationSeconds,
      status: "ACTIVE",
    })
    .returning();
  return rows[0] ?? null;
}

export async function insertBoardTilesData(
  boardId: string,
  labels: readonly string[],
  freeTileIndex: number,
  conn: DbLike = db,
) {
  const now = new Date();
  const values = labels.map((label, idx) => ({
    boardId,
    position: idx,
    label,
    isFreeTile: idx === freeTileIndex,
    completedAt: idx === freeTileIndex ? now : null,
  }));
  const rows = await conn.insert(bingoBoardTiles).values(values).returning();
  return rows;
}

export async function fetchBoardTilesWithProofData(
  boardId: string,
  conn: DbLike = db,
) {
  const rows = await conn
    .select({
      id: bingoBoardTiles.id,
      position: bingoBoardTiles.position,
      label: bingoBoardTiles.label,
      isFreeTile: bingoBoardTiles.isFreeTile,
      completedAt: bingoBoardTiles.completedAt,
      completedById: users.id,
      completedByName: users.name,
      completedByImage: users.image,
      submissionId: bingoSubmissions.id,
      submissionUrl: bingoSubmissions.discordMessageUrl,
      submissionGuildId: bingoSubmissions.discordGuildId,
      submissionChannelId: bingoSubmissions.discordChannelId,
      submissionMessageId: bingoSubmissions.discordMessageId,
      submissionCreatedAt: bingoSubmissions.createdAt,
    })
    .from(bingoBoardTiles)
    .leftJoin(users, eq(users.id, bingoBoardTiles.completedByUserId))
    .leftJoin(
      bingoSubmissions,
      eq(bingoSubmissions.id, bingoBoardTiles.completedSubmissionId),
    )
    .where(eq(bingoBoardTiles.boardId, boardId))
    .orderBy(asc(bingoBoardTiles.position));
  return rows;
}

export async function fetchBoardTileByIdData(
  boardTileId: string,
  conn: DbLike = db,
) {
  return conn.query.bingoBoardTiles.findFirst({
    where: eq(bingoBoardTiles.id, boardTileId),
  });
}

export async function fetchBoardTileShapeData(
  boardId: string,
  conn: DbLike = db,
) {
  return conn
    .select({
      position: bingoBoardTiles.position,
      isFreeTile: bingoBoardTiles.isFreeTile,
    })
    .from(bingoBoardTiles)
    .where(eq(bingoBoardTiles.boardId, boardId));
}

export async function createSubmissionData(
  params: {
    boardId: string;
    boardTileId: string;
    userId: string;
    discordMessageUrl: string;
    discordGuildId: string;
    discordChannelId: string;
    discordMessageId: string;
    validationPassed: boolean;
    validationMetadata?: unknown;
  },
  conn: DbLike = db,
) {
  const rows = await conn
    .insert(bingoSubmissions)
    .values({
      boardId: params.boardId,
      boardTileId: params.boardTileId,
      userId: params.userId,
      discordMessageUrl: params.discordMessageUrl,
      discordGuildId: params.discordGuildId,
      discordChannelId: params.discordChannelId,
      discordMessageId: params.discordMessageId,
      validationPassed: params.validationPassed,
      validationMetadata: (params.validationMetadata ?? null) as object | null,
    })
    .returning();
  return rows[0] ?? null;
}

export async function completeTileIfOpenData(
  params: {
    boardId: string;
    boardTileId: string;
    completedByUserId: string;
    submissionId: string;
    completedAt: Date;
  },
  conn: DbLike = db,
) {
  const rows = await conn
    .update(bingoBoardTiles)
    .set({
      completedByUserId: params.completedByUserId,
      completedSubmissionId: params.submissionId,
      completedAt: params.completedAt,
      updatedAt: params.completedAt,
    })
    .where(
      and(
        eq(bingoBoardTiles.id, params.boardTileId),
        eq(bingoBoardTiles.boardId, params.boardId),
        isNull(bingoBoardTiles.completedAt),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

export async function incrementScoreData(
  params: {
    boardId: string;
    userId: string;
    incrementBy: number;
  },
  conn: DbLike = db,
) {
  await conn
    .insert(bingoScores)
    .values({
      boardId: params.boardId,
      userId: params.userId,
      points: params.incrementBy,
    })
    .onConflictDoUpdate({
      target: [bingoScores.boardId, bingoScores.userId],
      set: {
        points: sql`${bingoScores.points} + ${params.incrementBy}`,
        updatedAt: new Date(),
      },
    });

  const rows = await conn
    .select({
      boardId: bingoScores.boardId,
      userId: bingoScores.userId,
      points: bingoScores.points,
    })
    .from(bingoScores)
    .where(
      and(
        eq(bingoScores.boardId, params.boardId),
        eq(bingoScores.userId, params.userId),
      ),
    );
  return rows[0] ?? null;
}

export async function countCompletedTilesData(
  boardId: string,
  conn: DbLike = db,
) {
  const rows = await conn
    .select({
      value: sql<number>`count(*)::int`,
    })
    .from(bingoBoardTiles)
    .where(
      and(eq(bingoBoardTiles.boardId, boardId), sql`${bingoBoardTiles.completedAt} is not null`),
    );
  return Number(rows[0]?.value ?? 0);
}

export async function fetchCompletedTilePositionsData(
  boardId: string,
  conn: DbLike = db,
) {
  const rows = await conn
    .select({ position: bingoBoardTiles.position })
    .from(bingoBoardTiles)
    .where(
      and(
        eq(bingoBoardTiles.boardId, boardId),
        sql`${bingoBoardTiles.completedAt} is not null`,
      ),
    );

  return rows.map((row) => row.position);
}

export async function countBoardTilesData(boardId: string, conn: DbLike = db) {
  const rows = await conn
    .select({ value: sql<number>`count(*)::int` })
    .from(bingoBoardTiles)
    .where(eq(bingoBoardTiles.boardId, boardId));
  return Number(rows[0]?.value ?? 0);
}

export async function updateBoardInactivityData(
  params: {
    boardId: string;
    firstCompletedAt: Date;
    expiresAt: Date;
  },
  conn: DbLike = db,
) {
  const rows = await conn
    .update(bingoBoards)
    .set({
      firstCompletedAt: params.firstCompletedAt,
      expiresAt: params.expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(bingoBoards.id, params.boardId))
    .returning();
  return rows[0] ?? null;
}

export async function markBoardCompletedData(
  params: { boardId: string; at: Date },
  conn: DbLike = db,
) {
  const rows = await conn
    .update(bingoBoards)
    .set({
      status: "COMPLETED",
      completedAt: params.at,
      endReason: "completion",
      updatedAt: params.at,
    })
    .where(
      and(eq(bingoBoards.id, params.boardId), eq(bingoBoards.status, "ACTIVE")),
    )
    .returning();
  return rows[0] ?? null;
}

export async function markBoardExpiredData(
  params: { boardId: string; at: Date },
  conn: DbLike = db,
) {
  const rows = await conn
    .update(bingoBoards)
    .set({
      status: "EXPIRED",
      expiredAt: params.at,
      endReason: "inactivity",
      updatedAt: params.at,
    })
    .where(
      and(eq(bingoBoards.id, params.boardId), eq(bingoBoards.status, "ACTIVE")),
    )
    .returning();
  return rows[0] ?? null;
}

export async function createBingoEventData(
  params: {
    type: BingoEventTypeDb;
    boardId: string;
    boardTileId?: string | null;
    submissionId?: string | null;
    userId?: string | null;
    payload?: unknown;
  },
  conn: DbLike = db,
) {
  const rows = await conn
    .insert(bingoEvents)
    .values({
      type: params.type,
      boardId: params.boardId,
      boardTileId: params.boardTileId ?? null,
      submissionId: params.submissionId ?? null,
      userId: params.userId ?? null,
      payload: (params.payload ?? null) as object | null,
    })
    .returning();
  return rows[0] ?? null;
}

export async function fetchLastEventCursorData(
  boardId: string,
  conn: DbLike = db,
) {
  const rows = await conn
    .select({ id: bingoEvents.id })
    .from(bingoEvents)
    .where(eq(bingoEvents.boardId, boardId))
    .orderBy(desc(bingoEvents.id))
    .limit(1);
  return Number(rows[0]?.id ?? 0);
}

export async function fetchBoardEventsSinceData(
  params: { boardId: string; since: number; limit?: number },
  conn: DbLike = db,
) {
  const rows = await conn
    .select({
      id: bingoEvents.id,
      type: bingoEvents.type,
      boardId: bingoEvents.boardId,
      boardTileId: bingoEvents.boardTileId,
      submissionId: bingoEvents.submissionId,
      userId: bingoEvents.userId,
      payload: bingoEvents.payload,
      createdAt: bingoEvents.createdAt,
    })
    .from(bingoEvents)
    .where(
      and(eq(bingoEvents.boardId, params.boardId), gt(bingoEvents.id, params.since)),
    )
    .orderBy(asc(bingoEvents.id))
    .limit(params.limit ?? 100);
  return rows;
}

export async function fetchBoardLeaderboardData(
  boardId: string,
  conn: DbLike = db,
) {
  return conn
    .select({
      userId: bingoScores.userId,
      points: bingoScores.points,
      name: users.name,
      image: users.image,
    })
    .from(bingoScores)
    .innerJoin(users, eq(users.id, bingoScores.userId))
    .where(eq(bingoScores.boardId, boardId))
    .orderBy(desc(bingoScores.points), asc(users.name));
}
