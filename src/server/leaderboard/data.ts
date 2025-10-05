import "server-only";

import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import { users, gearEdits, auditLogs } from "~/server/db/schema";

export interface LeaderboardRow {
  id: string;
  name: string | null;
  image: string | null;
  edits: number;
  creations: number;
  score: number;
}

/**
 * Fetch top contributors by simple score = edits (count) + gear creations (count).
 * Optionally filter edits by status in the future; today we count all edits to
 * match the homepage/global contribution semantics.
 */
export async function fetchContributorLeaderboardData(
  limit = 10,
): Promise<LeaderboardRow[]> {
  const [editsByUser, createsByUser] = await Promise.all([
    db
      .select({ userId: gearEdits.createdById, c: count() })
      .from(gearEdits)
      .groupBy(gearEdits.createdById),
    db
      .select({ userId: auditLogs.actorUserId, c: count() })
      .from(auditLogs)
      .where(eq(auditLogs.action, "GEAR_CREATE"))
      .groupBy(auditLogs.actorUserId),
  ]);

  const userIds = new Set<string>();
  for (const e of editsByUser) if (e.userId) userIds.add(e.userId);
  for (const c of createsByUser) if (c.userId) userIds.add(c.userId);

  const ids = Array.from(userIds);
  const userRows = ids.length
    ? await db
        .select({ id: users.id, name: users.name, image: users.image })
        .from(users)
        .where(inArray(users.id, ids))
    : [];

  const idToUser = new Map(userRows.map((u) => [u.id, u]));
  const editMap = new Map(editsByUser.map((r) => [r.userId, Number(r.c ?? 0)]));
  const createMap = new Map(
    createsByUser.map((r) => [r.userId, Number(r.c ?? 0)]),
  );

  const rows: LeaderboardRow[] = ids
    .map((id) => {
      const u = idToUser.get(id);
      const edits = editMap.get(id) ?? 0;
      const creations = createMap.get(id) ?? 0;
      const score = edits + creations;
      return {
        id,
        name: u?.name ?? null,
        image: u?.image ?? null,
        edits,
        creations,
        score,
      } satisfies LeaderboardRow;
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return rows;
}
