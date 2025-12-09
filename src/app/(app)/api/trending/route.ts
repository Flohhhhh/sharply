import { NextResponse, type NextRequest } from "next/server";
import { fetchTrendingPage } from "~/server/popularity/service";

const TIMEFRAMES = ["7d", "30d"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];
const isTimeframe = (value: string): value is Timeframe =>
  TIMEFRAMES.some((timeframe) => timeframe === value);

const GEAR_TYPES = ["CAMERA", "LENS"] as const;
type GearType = (typeof GEAR_TYPES)[number];
const isGearType = (value: string): value is GearType =>
  GEAR_TYPES.some((gearType) => gearType === value);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const timeframeParam = searchParams.get("timeframe") ?? "30d";
  if (!isTimeframe(timeframeParam)) {
    return NextResponse.json(
      { error: "timeframe must be one of 7d or 30d" },
      { status: 400 },
    );
  }
  const timeframe = timeframeParam;

  const pageParam = Number(searchParams.get("page") ?? 1);
  if (!Number.isFinite(pageParam) || pageParam < 1) {
    return NextResponse.json(
      { error: "page must be a positive number" },
      { status: 400 },
    );
  }

  const perPageParam = Number(searchParams.get("perPage") ?? 10);
  if (!Number.isFinite(perPageParam) || perPageParam < 1) {
    return NextResponse.json(
      { error: "perPage must be a positive number" },
      { status: 400 },
    );
  }

  const gearTypeParam = searchParams.get("gearType");
  const gearType =
    gearTypeParam && isGearType(gearTypeParam) ? gearTypeParam : undefined;

  const data = await fetchTrendingPage({
    timeframe,
    page: Math.floor(pageParam),
    perPage: Math.floor(perPageParam),
    filters: {
      gearType,
    },
  });

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
