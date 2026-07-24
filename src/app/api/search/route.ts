import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getMountIdFromSlug } from "~/lib/mapping/mounts-map";
import { searchGear, type SearchFilters } from "~/server/search/service";

function parsePriceParam(value: string | null) {
  if (value === null) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function parseNonNegativeNumber(value: string | null) {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parsePositiveNumber(value: string | null) {
  const parsed = parseNonNegativeNumber(value);
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

function normalizeRange(
  min: number | undefined,
  max: number | undefined,
): [number | undefined, number | undefined] {
  return min !== undefined && max !== undefined && min > max
    ? [max, min]
    : [min, max];
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
  const [megapixelsMin, megapixelsMax] = normalizeRange(
    parseNonNegativeNumber(searchParams.get("megapixelsMin")),
    parseNonNegativeNumber(searchParams.get("megapixelsMax")),
  );
  const [isoMin, isoMax] = normalizeRange(
    parsePositiveNumber(searchParams.get("isoMin")),
    parsePositiveNumber(searchParams.get("isoMax")),
  );
  const focalIncludes = parsePositiveNumber(searchParams.get("focalIncludes"));
  const widestFocalMax = parsePositiveNumber(
    searchParams.get("widestFocalMax"),
  );
  const longestFocalMin = parsePositiveNumber(
    searchParams.get("longestFocalMin"),
  );
  const fastestApertureMax = parsePositiveNumber(
    searchParams.get("fastestApertureMax"),
  );
  const hasAutofocus = searchParams.get("hasAutofocus") === "true";
  const hasStabilization = searchParams.get("hasStabilization") === "true";
  const hasIbis = searchParams.get("hasIbis") === "true";
  const hasWeatherSealing = searchParams.get("hasWeatherSealing") === "true";

  if (brand) filters.brand = brand;
  if (mount) filters.mount = mount;
  if (gearType) filters.gearType = gearType;
  if (sensorFormat) filters.sensorFormat = sensorFormat;
  if (lensType === "prime" || lensType === "zoom") filters.lensType = lensType;
  if (analogCameraType) filters.analogCameraType = analogCameraType;
  if (megapixelsMin !== undefined) filters.megapixelsMin = megapixelsMin;
  if (megapixelsMax !== undefined) filters.megapixelsMax = megapixelsMax;
  if (isoMin !== undefined) filters.isoMin = isoMin;
  if (isoMax !== undefined) filters.isoMax = isoMax;
  if (focalIncludes !== undefined) filters.focalIncludes = focalIncludes;
  if (widestFocalMax !== undefined) filters.widestFocalMax = widestFocalMax;
  if (longestFocalMin !== undefined) filters.longestFocalMin = longestFocalMin;
  if (fastestApertureMax !== undefined)
    filters.fastestApertureMax = fastestApertureMax;
  if (hasAutofocus) filters.hasAutofocus = true;
  if (hasStabilization) filters.hasStabilization = true;
  if (hasIbis) filters.hasIbis = true;
  if (hasWeatherSealing) filters.hasWeatherSealing = true;
  if (priceMin !== undefined) filters.priceMin = priceMin;
  if (priceMax !== undefined) filters.priceMax = priceMax;
  try {
    const result = await searchGear({
      query: query ?? undefined,
      sort: sort as "relevance" | "name" | "newest",
      page,
      pageSize,
      includeTotal,
      includeConstructionState: true,
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
