import { NextResponse, type NextRequest } from "next/server";
import { fetchReleaseFeedPage } from "~/server/gear/browse/service";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limitParam = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);

  if (!Number.isFinite(limitParam) || limitParam < 1) {
    return NextResponse.json(
      { error: "limit must be a positive number" },
      { status: 400 },
    );
  }

  const limit = Math.min(Math.floor(limitParam), MAX_LIMIT);
  const brandSlug = searchParams.get("brandSlug") ?? undefined;
  const offsetParam = Number(searchParams.get("offset") ?? 0);
  
  if (!Number.isFinite(offsetParam) || offsetParam < 0) {
    return NextResponse.json(
      { error: "offset must be a non-negative number" },
      { status: 400 },
    );
  }

  const offset = Math.floor(offsetParam);

  const page = await fetchReleaseFeedPage({
    limit,
    brandSlug: brandSlug ?? undefined,
    offset,
  });

  return NextResponse.json(page, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
