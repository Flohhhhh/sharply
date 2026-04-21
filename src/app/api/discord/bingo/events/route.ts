import { type NextRequest,NextResponse } from "next/server";
import { getActiveBoardEventsSince } from "~/server/bingo/service";

export async function GET(request: NextRequest) {
  try {
    const sinceRaw = request.nextUrl.searchParams.get("since") ?? "0";
    const since = Number.parseInt(sinceRaw, 10);
    if (!Number.isFinite(since) || since < 0) {
      return NextResponse.json(
        { error: "since must be a non-negative integer" },
        { status: 400 },
      );
    }

    const data = await getActiveBoardEventsSince(since);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/discord/bingo/events failed", error);
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 },
    );
  }
}
