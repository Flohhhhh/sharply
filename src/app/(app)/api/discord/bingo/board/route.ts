import { NextResponse } from "next/server";
import { getActiveBoardState } from "~/server/bingo/service";

export async function GET() {
  try {
    const board = await getActiveBoardState();
    return NextResponse.json(board, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/discord/bingo/board failed", error);
    return NextResponse.json(
      { error: "Failed to load board" },
      { status: 500 },
    );
  }
}
