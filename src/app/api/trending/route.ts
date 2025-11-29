import { NextResponse, type NextRequest } from "next/server";
import { fetchTrendingPage } from "~/server/popularity/service";

const TIMEFRAMES = new Set<"7d" | "30d">(["7d", "30d"]);
const GEAR_TYPES = new Set<"CAMERA" | "LENS">(["CAMERA", "LENS"]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const timeframeParam = (searchParams.get("timeframe") ?? "30d") as
    | "7d"
    | "30d"
    | string;
  if (!TIMEFRAMES.has(timeframeParam as "7d" | "30d")) {
    return NextResponse.json(
      { error: "timeframe must be one of 7d or 30d" },
      { status: 400 },
    );
  }

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
    gearTypeParam && GEAR_TYPES.has(gearTypeParam as "CAMERA" | "LENS")
      ? (gearTypeParam as "CAMERA" | "LENS")
      : undefined;

  const data = await fetchTrendingPage({
    timeframe: timeframeParam as "7d" | "30d",
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

