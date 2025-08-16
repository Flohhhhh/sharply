import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { auditLogs, gear, users, gearEdits } from "~/server/db/schema";
import { and, desc, eq, lt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (
    !session?.user ||
    !["ADMIN", "EDITOR"].includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const before = searchParams.get("before");
  const action = searchParams.get("action") as
    | (typeof auditLogs.action._.enumValues)[number]
    | null;
  const userId = searchParams.get("userId");
  const gearId = searchParams.get("gearId");

  const where = and(
    action ? eq(auditLogs.action, action) : undefined,
    userId ? eq(auditLogs.actorUserId, userId) : undefined,
    gearId ? eq(auditLogs.gearId, gearId) : undefined,
    before ? lt(auditLogs.createdAt, new Date(before)) : undefined,
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
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  const nextBefore = hasMore ? items[items.length - 1]!.createdAt : null;

  return NextResponse.json({ items, nextBefore });
}
