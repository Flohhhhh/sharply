import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { searchGear } from "~/server/search/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const sort = searchParams.get("sort") ?? "relevance";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

  try {
    const result = await searchGear({
      query: query ?? undefined,
      sort: sort as "relevance" | "name" | "newest",
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 },
    );
  }
}
