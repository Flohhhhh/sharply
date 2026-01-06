import { NextResponse, type NextRequest } from "next/server";
import {
  fetchReleaseFeedPage,
  loadHubData,
} from "~/server/gear/browse/service";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 60;

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function toRecord(sp: URLSearchParams): SearchParamsRecord {
  const record: SearchParamsRecord = {};
  for (const key of sp.keys()) {
    const values = sp.getAll(key);
    if (!values.length) continue;
    record[key] = values.length === 1 ? values[0] : values;
  }
  return record;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const view = (searchParams.get("view") ?? "feed").toLowerCase();

  if (view === "list") {
    const segments: string[] = [];
    const brandSlug = searchParams.get("brandSlug");
    const category = searchParams.get("category");
    const mount = searchParams.get("mount");
    if (brandSlug) segments.push(brandSlug);
    if (category) segments.push(category);
    if (mount) segments.push(mount);

    // Allow callers to explicitly pass segments[]=... for flexibility
    const segmentParams = searchParams.getAll("segments[]");
    if (segmentParams.length) segments.push(...segmentParams);

    const searchParamsRecord = toRecord(searchParams);
    delete searchParamsRecord.view;
    delete searchParamsRecord.brandSlug;
    delete searchParamsRecord.category;
    delete searchParamsRecord.mount;

    const { lists, filters } = await loadHubData({
      segments,
      searchParams: searchParamsRecord,
    });

    const items = lists.items.map((item) => ({
      ...item,
      releaseDate: item.releaseDate ? item.releaseDate.toISOString() : null,
      releaseDatePrecision: item.releaseDatePrecision ?? null,
      thumbnailUrl: item.thumbnailUrl ?? null,
      gearType: item.gearType ?? null,
      brandName: item.brandName ?? null,
      msrpNowUsdCents:
        typeof item.msrpNowUsdCents === "number" ? item.msrpNowUsdCents : null,
      mpbMaxPriceUsdCents:
        typeof item.mpbMaxPriceUsdCents === "number"
          ? item.mpbMaxPriceUsdCents
          : null,
    }));

    const hasMore = filters.page * filters.perPage < lists.total;

    return NextResponse.json(
      {
        items,
        total: lists.total,
        page: filters.page,
        perPage: filters.perPage,
        hasMore,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

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
