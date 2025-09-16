import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSuggestions } from "~/server/search/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.max(1, Math.min(20, Number(limitParam))) : 8;

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await getSuggestions(query, limit);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggest error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
