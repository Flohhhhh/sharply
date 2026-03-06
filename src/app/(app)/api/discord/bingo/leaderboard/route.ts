import { NextResponse } from "next/server";
import { getActiveBoardLeaderboard } from "~/server/bingo/service";

export async function GET() {
  try {
    const leaderboard = await getActiveBoardLeaderboard();
    return NextResponse.json(leaderboard, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/discord/bingo/leaderboard failed", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 },
    );
  }
}
