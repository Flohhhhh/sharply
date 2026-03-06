import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchCommunityBingoActivity } from "~/server/community-bingo/service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after") ?? undefined;
    const data = await fetchCommunityBingoActivity(after);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching community bingo activity", error);
    return NextResponse.json(
      { error: "Failed to fetch community bingo activity" },
      { status: 500 },
    );
  }
}
