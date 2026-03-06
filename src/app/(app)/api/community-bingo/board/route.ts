import { NextResponse } from "next/server";
import { fetchCommunityBingoBoard } from "~/server/community-bingo/service";

export async function GET() {
  try {
    const data = await fetchCommunityBingoBoard();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching community bingo board", error);
    return NextResponse.json(
      { error: "Failed to fetch community bingo board" },
      { status: 500 },
    );
  }
}
