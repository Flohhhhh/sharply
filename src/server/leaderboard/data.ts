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
 * Fetch top contributors by score = edits (field count) + gear creations (count).
 * Edits are weighted by the number of fields changed in the payload, matching
 * the gear page contributor logic.
 */
export async function fetchContributorLeaderboardData(
  limit = 10,
): Promise<LeaderboardRow[]> {
  const [editRows, createsByUser] = await Promise.all([
    db
      .select({
        userId: gearEdits.createdById,
        payload: gearEdits.payload,
      })
      .from(gearEdits),
    db
      .select({ userId: auditLogs.actorUserId, c: count() })
      .from(auditLogs)
      .where(eq(auditLogs.action, "GEAR_CREATE"))
      .groupBy(auditLogs.actorUserId),
  ]);

  // Count fields per user (matching gear page logic)
  const editsByUser = new Map<string, number>();
  const countFields = (payload: any): number => {
    if (!payload || typeof payload !== "object") return 0;
    let total = 0;
    const sections = ["core", "camera", "lens"] as const;
    for (const key of sections) {
      const section = (payload as any)[key];
      if (section && typeof section === "object") {
        total += Object.keys(section).length;
      }
    }
    return total;
  };

  for (const row of editRows) {
    if (!row.userId) continue;
    const fieldCount = countFields(row.payload);
    const current = editsByUser.get(row.userId) ?? 0;
    editsByUser.set(row.userId, current + fieldCount);
  }

  const userIds = new Set<string>();
  for (const userId of editsByUser.keys()) userIds.add(userId);
  for (const c of createsByUser) if (c.userId) userIds.add(c.userId);

  const ids = Array.from(userIds);
  const userRows = ids.length
    ? await db
        .select({ id: users.id, name: users.name, image: users.image })
        .from(users)
        .where(inArray(users.id, ids))
    : [];

  const idToUser = new Map(userRows.map((u) => [u.id, u]));
  const createMap = new Map(
    createsByUser.map((r) => [r.userId, Number(r.c ?? 0)]),
  );

  const rows: LeaderboardRow[] = ids
    .map((id) => {
      const u = idToUser.get(id);
      const edits = editsByUser.get(id) ?? 0;
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
