import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchGearOgBackfillCandidatesService } from "~/server/admin/gear/service";

function parseLimit(rawValue: string | null) {
  const parsed = Number.parseInt(rawValue ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 25;
  }

  return Math.min(parsed, 100);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"));
    const includeExisting = searchParams.get("mode") === "all";
    const result = await fetchGearOgBackfillCandidatesService({
      includeExisting,
      limit,
    });

    return NextResponse.json({
      eligibleCount: result.eligibleCount,
      includeExisting,
      items: result.items,
      limit,
      returnedCount: result.items.length,
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to load OG candidates";
    return NextResponse.json({ error: message }, { status });
  }
}
