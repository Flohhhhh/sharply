import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSuggestions } from "~/server/search/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await getSuggestions(query, 8);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggest error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
