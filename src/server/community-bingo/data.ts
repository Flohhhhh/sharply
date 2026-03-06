import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  communityBingoBoards,
  communityBingoEvents,
  communityBingoScores,
  communityBingoSubmissions,
  communityBingoTiles,
  users,
} from "~/server/db/schema";

export type CommunityBingoBoardRow = typeof communityBingoBoards.$inferSelect;
export type CommunityBingoTileRow = typeof communityBingoTiles.$inferSelect;
export type CommunityBingoScoreRow = typeof communityBingoScores.$inferSelect;
export type CommunityBingoSubmissionRow = typeof communityBingoSubmissions.$inferSelect;

export async function fetchActiveBoardData() {
  const rows = await db
    .select()
    .from(communityBingoBoards)
    .where(eq(communityBingoBoards.status, "ACTIVE"))
    .orderBy(desc(communityBingoBoards.createdAt))
    .limit(1);

  return rows[0] ?? null;
}


export async function fetchMostRecentBoardData() {
  const rows = await db
    .select()
    .from(communityBingoBoards)
    .orderBy(desc(communityBingoBoards.createdAt))
    .limit(1);

  return rows[0] ?? null;
}

export async function fetchBoardByIdData(boardId: string) {
  const rows = await db
    .select()
    .from(communityBingoBoards)
    .where(eq(communityBingoBoards.id, boardId))
    .limit(1);
  return rows[0] ?? null;
}

export async function createBoardData(params: {
  title: string;
  createdById?: string;
}) {
  const rows = await db
    .insert(communityBingoBoards)
    .values({
      title: params.title,
      createdById: params.createdById,
    })
    .returning();
  return rows[0] ?? null;
}

export async function createTilesData(boardId: string, labels: readonly string[]) {
  if (labels.length === 0) return [];
  return db
    .insert(communityBingoTiles)
    .values(labels.map((label, index) => ({ boardId, label, position: index })))
    .returning();
}

export async function fetchTilesByBoardIdData(boardId: string) {
  return db
    .select({
      id: communityBingoTiles.id,
      boardId: communityBingoTiles.boardId,
      position: communityBingoTiles.position,
      label: communityBingoTiles.label,
      completedById: communityBingoTiles.completedById,
      completedAt: communityBingoTiles.completedAt,
      proofSubmissionId: communityBingoTiles.proofSubmissionId,
      createdAt: communityBingoTiles.createdAt,
      updatedAt: communityBingoTiles.updatedAt,
      completedByHandle: users.handle,
      completedByName: users.name,
    })
    .from(communityBingoTiles)
    .leftJoin(users, eq(users.id, communityBingoTiles.completedById))
    .where(eq(communityBingoTiles.boardId, boardId))
    .orderBy(asc(communityBingoTiles.position));
}

export async function fetchTileByIdData(tileId: string) {
  const rows = await db
    .select()
    .from(communityBingoTiles)
    .where(eq(communityBingoTiles.id, tileId))
    .limit(1);
  return rows[0] ?? null;
}

export async function createSubmissionData(params: {
  boardId: string;
  tileId: string;
  submittedById: string;
  discordMessageUrl: string;
  discordGuildId?: string;
  discordChannelId?: string;
  discordMessageId?: string;
  note?: string;
}) {
  const rows = await db
    .insert(communityBingoSubmissions)
    .values(params)
    .returning();
  return rows[0] ?? null;
}

export async function completeTileData(params: {
  tileId: string;
  userId: string;
  proofSubmissionId: string;
}) {
  const rows = await db
    .update(communityBingoTiles)
    .set({
      completedById: params.userId,
      completedAt: new Date(),
      proofSubmissionId: params.proofSubmissionId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(communityBingoTiles.id, params.tileId),
        sql`${communityBingoTiles.completedAt} is null`,
      ),
    )
    .returning();

  return rows[0] ?? null;
}

export async function fetchSubmissionByTileIdData(tileId: string) {
  const rows = await db
    .select()
    .from(communityBingoSubmissions)
    .where(eq(communityBingoSubmissions.tileId, tileId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertScoreData(params: {
  boardId: string;
  userId: string;
  pointsDelta: number;
  claimsDelta: number;
}) {
  await db
    .insert(communityBingoScores)
    .values({
      boardId: params.boardId,
      userId: params.userId,
      points: params.pointsDelta,
      tileClaims: params.claimsDelta,
    })
    .onConflictDoUpdate({
      target: [communityBingoScores.boardId, communityBingoScores.userId],
      set: {
        points: sql`${communityBingoScores.points} + ${params.pointsDelta}`,
        tileClaims: sql`${communityBingoScores.tileClaims} + ${params.claimsDelta}`,
        updatedAt: new Date(),
      },
    });

  const rows = await db
    .select()
    .from(communityBingoScores)
    .where(
      and(
        eq(communityBingoScores.boardId, params.boardId),
        eq(communityBingoScores.userId, params.userId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function fetchLeaderboardByBoardIdData(boardId: string) {
  return db
    .select({
      id: communityBingoScores.id,
      userId: communityBingoScores.userId,
      points: communityBingoScores.points,
      tileClaims: communityBingoScores.tileClaims,
      updatedAt: communityBingoScores.updatedAt,
      userName: users.name,
      userHandle: users.handle,
      userImage: users.image,
    })
    .from(communityBingoScores)
    .innerJoin(users, eq(users.id, communityBingoScores.userId))
    .where(eq(communityBingoScores.boardId, boardId))
    .orderBy(desc(communityBingoScores.points), asc(communityBingoScores.updatedAt));
}

export async function fetchBoardProgressData(boardId: string) {
  const rows = await db
    .select({
      totalTiles: sql<number>`cast(count(${communityBingoTiles.id}) as int)`,
      completedTiles:
        sql<number>`cast(sum(case when ${communityBingoTiles.completedAt} is null then 0 else 1 end) as int)`,
    })
    .from(communityBingoTiles)
    .where(eq(communityBingoTiles.boardId, boardId));

  return rows[0] ?? { totalTiles: 0, completedTiles: 0 };
}

export async function updateBoardStatusData(params: {
  boardId: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED" | "EXPIRED";
}) {
  const rows = await db
    .update(communityBingoBoards)
    .set({
      status: params.status,
      completedAt: params.status === "COMPLETED" ? new Date() : null,
      archivedAt: params.status === "ARCHIVED" ? new Date() : null,
      expiredAt: params.status === "EXPIRED" ? new Date() : null,
      inactivityExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(communityBingoBoards.id, params.boardId))
    .returning();

  return rows[0] ?? null;
}


export async function updateBoardInactivityExpiryData(params: {
  boardId: string;
  inactivityExpiresAt: Date | null;
}) {
  const rows = await db
    .update(communityBingoBoards)
    .set({
      inactivityExpiresAt: params.inactivityExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(communityBingoBoards.id, params.boardId))
    .returning();

  return rows[0] ?? null;
}

export async function createEventData(params: {
  boardId: string;
  tileId?: string;
  actorUserId?: string;
  eventType:
    | "submission_created"
    | "tile_completed"
    | "score_changed"
    | "board_completed"
    | "board_archived"
    | "new_board_created"
    | "board_expiration_timer_started"
    | "board_expiration_timer_extended"
    | "board_expired_inactivity";
  metadata?: Record<string, unknown>;
}) {
  const rows = await db
    .insert(communityBingoEvents)
    .values({
      boardId: params.boardId,
      tileId: params.tileId,
      actorUserId: params.actorUserId,
      eventType: params.eventType,
      metadata: params.metadata,
    })
    .returning();

  return rows[0] ?? null;
}

export async function fetchRecentEventsData(params: {
  boardId: string;
  after?: string;
  limit?: number;
}) {
  const eventRows = await db
    .select({
      id: communityBingoEvents.id,
      boardId: communityBingoEvents.boardId,
      tileId: communityBingoEvents.tileId,
      actorUserId: communityBingoEvents.actorUserId,
      eventType: communityBingoEvents.eventType,
      metadata: communityBingoEvents.metadata,
      createdAt: communityBingoEvents.createdAt,
      actorHandle: users.handle,
      actorName: users.name,
    })
    .from(communityBingoEvents)
    .leftJoin(users, eq(users.id, communityBingoEvents.actorUserId))
    .where(
      params.after
        ? and(
            eq(communityBingoEvents.boardId, params.boardId),
            sql`${communityBingoEvents.createdAt} > ${params.after}`,
          )
        : eq(communityBingoEvents.boardId, params.boardId),
    )
    .orderBy(desc(communityBingoEvents.createdAt))
    .limit(params.limit ?? 25);

  return eventRows.reverse();
}
