"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  flexRender,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";
import useSWR from "swr";
import type { AdminGearTableRow } from "~/types/gear";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "~/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { useDebounce } from "~/lib/hooks/useDebounce";
import { Loader2 } from "lucide-react";

// (client component) will contain our <DataTable /> component.

interface GearDataTableProps {
  columns: ColumnDef<AdminGearTableRow>[];
  pageSizeOptions: readonly number[];
}

export function GearDataTable({
  columns,
  pageSizeOptions,
}: GearDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const [searchValue, setSearchValue] = useState<string>("");
  const debouncedQuery = useDebounce(searchValue, 300);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(pageSizeOptions[1] ?? 20);

  const key = useMemo(() => {
    const q = debouncedQuery.trim();
    const params = new URLSearchParams();
    params.set("page", String(page + 1));
    params.set("limit", String(pageSize));
    if (q) params.set("q", q);
    return `/api/admin/gear/list?${params.toString()}`;
  }, [debouncedQuery, page, pageSize]);

  const fetcher = useCallback(async (url: string) => {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return (await res.json()) as {
      items: AdminGearTableRow[];
      totalCount: number;
    };
  }, []);

  const {
    data,
    isLoading: swrLoading,
    isValidating,
  } = useSWR(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });
  useEffect(() => {
    // stop loading when data settles
    if (!swrLoading && !isValidating && data) {
      setIsLoading(false);
    }
  }, [data, swrLoading, isValidating]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage < 0 || nextPage >= pageCount || nextPage === page) {
        return;
      }
      setIsLoading(true);
      setPage(nextPage);
    },
    [page, pageCount],
  );

  const handlePageSizeChange = useCallback(
    (nextSize: number) => {
      if (!pageSizeOptions.includes(nextSize) || nextSize === pageSize) {
        return;
      }
      setIsLoading(true);
      setPageSize(nextSize);
      setPage(0);
    },
    [pageSize, pageSizeOptions],
  );

  const canPrevious = page > 0;
  const canNext = page + 1 < pageCount;

  const pageItems = useMemo(() => {
    if (pageCount <= 1) return null;

    const items: ReactNode[] = [];
    const totalToShow = 5;
    const half = Math.floor(totalToShow / 2);
    let start = Math.max(page - half, 0);
    const end = Math.min(start + totalToShow - 1, pageCount - 1);

    if (end - start + 1 < totalToShow) {
      start = Math.max(end - totalToShow + 1, 0);
    }

    const pushPage = (pageIdx: number) => {
      items.push(
        <PaginationItem key={pageIdx}>
          <PaginationLink
            href="#"
            isActive={pageIdx === page}
            onClick={(event) => {
              event.preventDefault();
              handlePageChange(pageIdx);
            }}
          >
            {pageIdx + 1}
          </PaginationLink>
        </PaginationItem>,
      );
    };

    if (start > 0) {
      pushPage(0);
      if (start > 1) {
        items.push(
          <PaginationItem key="start-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
    }

    for (let i = start; i <= end; i++) {
      pushPage(i);
    }

    if (end < pageCount - 1) {
      if (end < pageCount - 2) {
        items.push(
          <PaginationItem key="end-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
      pushPage(pageCount - 1);
    }

    return items;
  }, [page, handlePageChange, pageCount]);

  const visibleRowCount = table.getRowModel().rows.length;
  const busy = isLoading || swrLoading || isValidating;

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md">
          <Input
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setIsLoading(true);
            }}
            placeholder="Filter by name, slug, brand..."
            className="bg-white pr-10"
          />
          {busy && (
            <div className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}
        </div>
      </div>
      <div
        className={
          busy ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-2 border-t px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground text-sm">
            Showing {visibleRowCount} of {totalCount} items
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-9 w-[5.5rem]">
                  <SelectValue aria-label={`Rows per page ${pageSize}`} />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Pagination className="w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    aria-disabled={!canPrevious}
                    tabIndex={canPrevious ? 0 : -1}
                    href={canPrevious ? "#" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      handlePageChange(page - 1);
                    }}
                    className={
                      !canPrevious
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
                {pageItems}
                <PaginationItem>
                  <PaginationNext
                    aria-disabled={!canNext}
                    tabIndex={canNext ? 0 : -1}
                    href={canNext ? "#" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      handlePageChange(page + 1);
                    }}
                    className={
                      !canNext ? "pointer-events-none opacity-50" : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}
