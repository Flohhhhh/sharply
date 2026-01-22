import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { searchGear, type SearchFilters } from "~/server/search/service";
import { getMountIdFromSlug } from "~/lib/mapping/mounts-map";

const PRICE_DOLLAR_UI_MAX = 20000; // matches Filters slider cap

function parsePriceParam(value: string | null) {
  if (value === null) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const sort = searchParams.get("sort") ?? "relevance";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const includeTotalParam = searchParams.get("includeTotal");
  const includeTotal =
    includeTotalParam === null ? true : includeTotalParam !== "false";

  // Extract filter parameters
  const filters: SearchFilters = {};
  const brand = searchParams.get("brand");
  const mount = searchParams.get("mount")
    ? getMountIdFromSlug(searchParams.get("mount")!)
    : null;
  const gearType = searchParams.get("gearType");
  const sensorFormat = searchParams.get("sensorFormat");
  const lensType = searchParams.get("lensType");
  const analogCameraType = searchParams.get("analogCameraType");
  const rawPriceMin = searchParams.get("priceMin");
  const rawPriceMax = searchParams.get("priceMax");
  const priceMin = parsePriceParam(rawPriceMin);
  const priceMax = parsePriceParam(rawPriceMax);
  const rawMpMin = searchParams.get("megapixelsMin");
  const rawMpMax = searchParams.get("megapixelsMax");
  const megapixelsMin =
    rawMpMin !== null && Number.isFinite(Number(rawMpMin))
      ? Number(rawMpMin)
      : undefined;
  const megapixelsMax =
    rawMpMax !== null && Number.isFinite(Number(rawMpMax))
      ? Number(rawMpMax)
      : undefined;

  if (brand) filters.brand = brand;
  if (mount) filters.mount = mount;
  if (gearType) filters.gearType = gearType;
  if (sensorFormat) filters.sensorFormat = sensorFormat;
  if (lensType === "prime" || lensType === "zoom") filters.lensType = lensType;
  if (analogCameraType) filters.analogCameraType = analogCameraType;
  if (megapixelsMin !== undefined) filters.megapixelsMin = megapixelsMin;
  if (megapixelsMax !== undefined) filters.megapixelsMax = megapixelsMax;
  if (priceMin !== undefined) filters.priceMin = priceMin;
  if (priceMax !== undefined) filters.priceMax = priceMax;
  try {
    const result = await searchGear({
      query: query ?? undefined,
      sort: sort as "relevance" | "name" | "newest",
      page,
      pageSize,
      includeTotal,
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
