import { NextResponse,type NextRequest } from "next/server";
import { urlSearchParamsToRecord } from "~/lib/browse/query";
import {
  fetchBrowseListPage,
  fetchReleaseFeedPage,
} from "~/server/gear/browse/service";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 60;

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

    const searchParamsRecord = urlSearchParamsToRecord(searchParams);
    delete searchParamsRecord.view;
    delete searchParamsRecord.brandSlug;
    delete searchParamsRecord.category;
    delete searchParamsRecord.mount;

    const page = await fetchBrowseListPage({
      segments,
      searchParams: searchParamsRecord,
    });

    return NextResponse.json(
      page,
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
