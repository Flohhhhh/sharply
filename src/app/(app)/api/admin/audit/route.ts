import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchAuditLogs } from "~/server/admin/audit/service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const before = searchParams.get("before");
  const action = searchParams.get("action");
  const userId = searchParams.get("userId");
  const gearId = searchParams.get("gearId");

  const { items } = await fetchAuditLogs({
    limit,
    before: before ? new Date(before) : undefined,
    action: (action as any) ?? null,
    userId: userId ?? null,
    gearId: gearId ?? null,
  });

  const hasMore = items.length > limit;
  const nextBefore = hasMore ? items[items.length - 1]!.createdAt : null;

  return NextResponse.json({ items: items.slice(0, limit), nextBefore });
}
