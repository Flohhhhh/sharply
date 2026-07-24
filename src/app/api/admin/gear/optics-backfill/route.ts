import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchLensOpticsBackfillCandidatesService } from "~/server/admin/gear/service";

const DEFAULT_LIMIT = 25;
const MIN_LIMIT = 25;
const MAX_LIMIT = 50;

function parseLimit(rawValue: string | null) {
  const parsed = Number.parseInt(rawValue ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, parsed));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"));
    const result = await fetchLensOpticsBackfillCandidatesService({ limit });

    return NextResponse.json({
      eligibleCount: result.eligibleCount,
      actionableCount: result.actionableCount,
      skippedCount: result.skippedCount,
      items: result.items,
      limit,
      returnedCount: result.items.length,
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load optics backfill candidates";
    return NextResponse.json({ error: message }, { status });
  }
}
