"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  flexRender,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { normalizeFuzzyTokens } from "~/lib/utils/fuzzy";

// (client component) will contain our <DataTable /> component.

interface GearDataTableProps {
  columns: ColumnDef<AdminGearTableRow>[];
  data: AdminGearTableRow[];
  pageCount: number;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  pageSizeOptions: readonly number[];
}

export function GearDataTable({
  columns,
  data,
  pageCount,
  currentPage,
  pageSize,
  totalCount,
  pageSizeOptions,
}: GearDataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = useMemo(
    () => searchParams?.toString() ?? "",
    [searchParams],
  );
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const [searchValue, setSearchValue] = useState<string>("");
  const searchTokens = useMemo(() => {
    if (!searchValue.trim()) return [];
    return normalizeFuzzyTokens(searchValue);
  }, [searchValue]);

  const filteredData = useMemo(() => {
    if (searchTokens.length === 0) return data;
    return data.filter((item) => {
      const haystack =
        `${item.name} ${item.brandName} ${item.slug ?? ""}`.toLowerCase();
      return searchTokens.every((token) => haystack.includes(token));
    });
  }, [data, searchTokens]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage < 0 || nextPage >= pageCount || nextPage === currentPage) {
        return;
      }

      const params = new URLSearchParams(searchParamsString);
      params.set("page", String(nextPage + 1));
      params.set("limit", String(pageSize));

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [currentPage, pageCount, pageSize, pathname, router, searchParamsString],
  );

  const handlePageSizeChange = useCallback(
    (nextSize: number) => {
      if (!pageSizeOptions.includes(nextSize) || nextSize === pageSize) {
        return;
      }

      const params = new URLSearchParams(searchParamsString);
      params.set("limit", String(nextSize));
      params.set("page", "1");

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pageSize, pageSizeOptions, pathname, router, searchParamsString],
  );

  const canPrevious = currentPage > 0;
  const canNext = currentPage + 1 < pageCount;

  const pageItems = useMemo(() => {
    if (pageCount <= 1) return null;

    const items: ReactNode[] = [];
    const totalToShow = 5;
    const half = Math.floor(totalToShow / 2);
    let start = Math.max(currentPage - half, 0);
    const end = Math.min(start + totalToShow - 1, pageCount - 1);

    if (end - start + 1 < totalToShow) {
      start = Math.max(end - totalToShow + 1, 0);
    }

    const pushPage = (pageIdx: number) => {
      items.push(
        <PaginationItem key={pageIdx}>
          <PaginationLink
            href="#"
            isActive={pageIdx === currentPage}
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
  }, [currentPage, handlePageChange, pageCount]);

  const visibleRowCount = table.getRowModel().rows.length;
  const originalRowCount = data.length;

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Filter by name, slug, brand..."
          className="max-w-md bg-white"
        />
      </div>
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-col gap-2 border-t px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-sm">
          Showing {visibleRowCount} of {originalRowCount} items
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
                    handlePageChange(currentPage - 1);
                  }}
                  className={
                    !canPrevious ? "pointer-events-none opacity-50" : undefined
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
                    handlePageChange(currentPage + 1);
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
  );
}
