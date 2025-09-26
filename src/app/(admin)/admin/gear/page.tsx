import { GearDataTable } from "./data-table";
import { columns } from "./columns";
import { fetchAdminGearItems } from "~/server/admin/gear/service";
import GearBulkCreate from "../gear-bulk-create";
import { auth } from "~/server/auth";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

type AdminGearPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminGearPage({
  searchParams,
}: AdminGearPageProps) {
  const session = await auth();
  const userRole = session?.user?.role ?? "USER";
  const resolvedSearchParams = (await searchParams) ?? {};

  const pageParam = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;
  const limitParam = Array.isArray(resolvedSearchParams.limit)
    ? resolvedSearchParams.limit[0]
    : resolvedSearchParams.limit;

  const pageNumber = Math.max(parseInt(pageParam ?? "1", 10) || 1, 1);
  const requestedPageSize =
    parseInt(limitParam ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;

  const normalizedPageSize = PAGE_SIZE_OPTIONS.includes(
    requestedPageSize as (typeof PAGE_SIZE_OPTIONS)[number],
  )
    ? requestedPageSize
    : DEFAULT_PAGE_SIZE;

  const pageSize = Math.min(Math.max(normalizedPageSize, 1), MAX_PAGE_SIZE);
  const offset = (pageNumber - 1) * pageSize;

  const { items, totalCount } = await fetchAdminGearItems({
    limit: pageSize,
    offset,
  });

  const pageCount = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
  const clampedPage = Math.min(pageNumber - 1, Math.max(pageCount - 1, 0));

  return (
    <div className="space-y-8">
      {/* {userRole === "ADMIN" && ( */}
      <div>
        <h2 className="text-2xl font-bold">Bulk Create</h2>
        <p className="text-muted-foreground mt-2">
          Create many gear items for a brand and type with validation.
        </p>
        <div className="mt-4">
          <GearBulkCreate />
        </div>
      </div>
      {/* )} */}

      <GearDataTable
        columns={columns}
        data={items}
        pageCount={pageCount}
        currentPage={clampedPage}
        pageSize={pageSize}
        totalCount={totalCount}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
      />
    </div>
  );
}
