import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { searchGear, type SearchFilters } from "~/server/search/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const sort = searchParams.get("sort") ?? "relevance";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

  // Extract filter parameters
  const filters: SearchFilters = {};
  const brand = searchParams.get("brand");
  const mount = searchParams.get("mount");
  const gearType = searchParams.get("gearType");
  const sensorFormat = searchParams.get("sensorFormat");

  if (brand) filters.brand = brand;
  if (mount) filters.mount = mount;
  if (gearType) filters.gearType = gearType;
  if (sensorFormat) filters.sensorFormat = sensorFormat;
  try {
    const result = await searchGear({
      query: query ?? undefined,
      sort: sort as "relevance" | "name" | "newest",
      page,
      pageSize,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
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
