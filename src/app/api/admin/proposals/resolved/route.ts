import { NextResponse } from "next/server";
import { fetchResolvedProposalGroupsWithCount } from "~/server/admin/proposals/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const daysParam = Number(searchParams.get("days") ?? "7");
  const limitParam = Number(searchParams.get("limit") ?? "20");
  const days = Number.isFinite(daysParam)
    ? Math.min(Math.max(Math.trunc(daysParam), 1), 30)
    : 7;
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), 50)
    : 20;

  try {
    const {
      groups,
      count,
      days: actualDays,
    } = await fetchResolvedProposalGroupsWithCount(days, limit);
    return NextResponse.json({ groups, count, days: actualDays, limit });
  } catch (e: any) {
    const status = (e)?.status ?? 500;
    const message = (e)?.message ?? "Failed to load resolved proposals";
    return NextResponse.json({ error: message }, { status });
  }
}
