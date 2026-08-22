import { type NextRequest, NextResponse } from "next/server";
import { getLiveTrendingStatusForSlugs } from "~/server/popularity/service";
import type { GearType } from "~/types/gear";

const GEAR_TYPES = new Set<GearType>(["CAMERA", "ANALOG_CAMERA", "LENS"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_SLUGS = 50;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slugs = Array.from(new Set(searchParams.getAll("slug")));
  if (
    slugs.length === 0 ||
    slugs.length > MAX_SLUGS ||
    slugs.some((slug) => !SLUG_PATTERN.test(slug))
  ) {
    return NextResponse.json(
      { error: `Provide between 1 and ${MAX_SLUGS} valid slugs` },
      { status: 400 },
    );
  }

  const timeframe = searchParams.get("timeframe") ?? "30d";
  if (timeframe !== "7d" && timeframe !== "30d") {
    return NextResponse.json(
      { error: "timeframe must be one of 7d or 30d" },
      { status: 400 },
    );
  }

  const limit = Number(searchParams.get("limit") ?? 20);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return NextResponse.json(
      { error: "limit must be an integer between 1 and 100" },
      { status: 400 },
    );
  }

  const gearTypeParam = searchParams.get("gearType");
  const gearType =
    gearTypeParam && GEAR_TYPES.has(gearTypeParam as GearType)
      ? (gearTypeParam as GearType)
      : undefined;
  if (gearTypeParam && !gearType) {
    return NextResponse.json({ error: "invalid gearType" }, { status: 400 });
  }

  const brandId = searchParams.get("brandId") ?? undefined;
  const mountId = searchParams.get("mountId") ?? undefined;
  if (
    (brandId && !UUID_PATTERN.test(brandId)) ||
    (mountId && !UUID_PATTERN.test(mountId))
  ) {
    return NextResponse.json(
      { error: "brandId and mountId must be valid UUIDs" },
      { status: 400 },
    );
  }

  const trending = await getLiveTrendingStatusForSlugs(slugs, {
    timeframe,
    limit,
    filters: {
      brandId,
      mountId,
      gearType,
    },
  });

  return NextResponse.json(
    { trendingSlugs: slugs.filter((slug) => trending.has(slug)) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
