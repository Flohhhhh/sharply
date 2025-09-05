import "server-only";

import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "~/server/db";
import { auditLogs, gear, users, gearEdits } from "~/server/db/schema";

export type AuditAction = (typeof auditLogs.action.enumValues)[number];

export type AuditLogRow = {
  id: string;
  createdAt: Date;
  action: AuditAction;
  actorId: string | null;
  actorName: string | null;
  gearId: string | null;
  gearName: string | null;
  gearSlug: string | null;
  gearEditId: string | null;
  editStatus: (typeof gearEdits.status.enumValues)[number] | null;
};

export interface FetchAuditLogsParams {
  limit: number;
  before?: Date | null;
  action?: AuditAction | null;
  userId?: string | null;
  gearId?: string | null;
}

export async function fetchAuditLogsData(
  params: FetchAuditLogsParams,
): Promise<AuditLogRow[]> {
  const { limit, before, action, userId, gearId } = params;

  const where = and(
    action ? eq(auditLogs.action, action) : undefined,
    userId ? eq(auditLogs.actorUserId, userId) : undefined,
    gearId ? eq(auditLogs.gearId, gearId) : undefined,
    before ? lt(auditLogs.createdAt, before) : undefined,
  );

  const rows = await db
    .select({
      id: auditLogs.id,
      createdAt: auditLogs.createdAt,
      action: auditLogs.action,
      actorId: users.id,
      actorName: users.name,
      gearId: gear.id,
      gearName: gear.name,
      gearSlug: gear.slug,
      gearEditId: gearEdits.id,
      editStatus: gearEdits.status,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorUserId, users.id))
    .leftJoin(gear, eq(auditLogs.gearId, gear.id))
    .leftJoin(gearEdits, eq(auditLogs.gearEditId, gearEdits.id))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return rows as unknown as AuditLogRow[];
}
