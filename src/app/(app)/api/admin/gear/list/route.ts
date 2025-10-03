import { NextResponse } from "next/server";
import { fetchAdminGearItems } from "~/server/admin/gear/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sp = url.searchParams;

  const DEFAULT_PAGE_SIZE = 20;
  const MAX_PAGE_SIZE = 100;
  const PAGE_SIZE_OPTIONS = new Set([10, 20, 50, 100]);

  const pageParam = sp.get("page");
  const limitParam = sp.get("limit");
  const q = sp.get("q") ?? undefined;

  const pageNumber = Math.max(parseInt(pageParam ?? "1", 10) || 1, 1);
  const requestedPageSize =
    parseInt(limitParam ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;

  const normalizedPageSize = PAGE_SIZE_OPTIONS.has(requestedPageSize)
    ? requestedPageSize
    : DEFAULT_PAGE_SIZE;

  const pageSize = Math.min(Math.max(normalizedPageSize, 1), MAX_PAGE_SIZE);
  const offset = (pageNumber - 1) * pageSize;

  const { items, totalCount } = await fetchAdminGearItems({
    limit: pageSize,
    offset,
    q,
  });

  return NextResponse.json({ items, totalCount });
}
