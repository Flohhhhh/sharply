import { type NextRequest, NextResponse } from "next/server";
import { fetchGearStats } from "~/server/gear/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const stats = await fetchGearStats(slug);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Gear stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
