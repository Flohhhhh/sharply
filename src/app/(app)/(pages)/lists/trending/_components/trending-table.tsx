"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  Loader,
  Flame,
  ImageOff,
  MoreHorizontal,
  ExternalLink,
  Plus,
  Scale,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from "~/components/ui/pagination";
import type { TrendingEntry, TrendingPageResult } from "~/types/popularity";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useCompare } from "~/lib/hooks/useCompare";
import type { GearType } from "~/types/gear";

const WINDOW_OPTIONS: Array<"7d" | "30d"> = ["7d", "30d"];
const TYPE_OPTIONS = [
  { label: "All gear", value: "ALL" },
  { label: "Cameras", value: "CAMERA" },
  { label: "Analog Cameras", value: "ANALOG_CAMERA" },
  { label: "Lenses", value: "LENS" },
] as const;
const PER_PAGE_OPTIONS = [20, 50, 100];

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return (await res.json()) as TrendingPageResult;
};

type Props = {
  initialData: TrendingPageResult;
};

function buildKey(params: {
  timeframe: "7d" | "30d";
  page: number;
  perPage: number;
  gearType?: GearType;
}) {
  const search = new URLSearchParams({
    timeframe: params.timeframe,
    page: String(params.page),
    perPage: String(params.perPage),
  });
  if (params.gearType) {
    search.set("gearType", params.gearType);
  }
  return `/api/trending?${search.toString()}`;
}

const numberFormatter = new Intl.NumberFormat("en-US");
const liveDeltaFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});
export function TrendingTable({ initialData }: Props) {
  const [timeframe, setTimeframe] = useState<"7d" | "30d">(
    initialData.timeframe,
  );
  const [gearType, setGearType] = useState<"ALL" | GearType>(
    initialData.filters.gearType ?? "ALL",
  );
  const [page, setPage] = useState(initialData.page);
  const [perPage, setPerPage] = useState(initialData.perPage);

  useEffect(() => {
    setPage(1);
  }, [timeframe, gearType, perPage]);

  const requestKey = useMemo(
    () =>
      buildKey({
        timeframe,
        page,
        perPage,
        gearType: gearType === "ALL" ? undefined : gearType,
      }),
    [timeframe, page, perPage, gearType],
  );

  const initialKey = useMemo(
    () =>
      buildKey({
        timeframe: initialData.timeframe,
        page: initialData.page,
        perPage: initialData.perPage,
        gearType: initialData.filters.gearType,
      }),
    [initialData],
  );

  const { data, error, isValidating } = useSWR<TrendingPageResult>(
    requestKey,
    fetcher,
    {
      fallbackData: requestKey === initialKey ? initialData : undefined,
      keepPreviousData: true,
    },
  );

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages =
    data && data.perPage > 0 ? Math.max(1, Math.ceil(total / data.perPage)) : 1;
  const topScore = rows[0]?.score ?? 0;
  const showLiveBoostBanner = data?.items?.some((row) => row.liveBoost);

  const handlePageChange = useCallback(
    (direction: "prev" | "next") => {
      setPage((current) => {
        if (direction === "prev") {
          return Math.max(1, current - 1);
        }
        if (data && totalPages) {
          return Math.min(totalPages, current + 1);
        }
        return current + 1;
      });
    },
    [data, totalPages],
  );

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages || rows.length < perPage;
  const paginationItems = buildPaginationItems(page, totalPages);

  return (
    <section className="">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ButtonGroup>
              {WINDOW_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={timeframe === option ? "default" : "outline"}
                  onClick={() => setTimeframe(option)}
                >
                  {option}
                </Button>
              ))}
            </ButtonGroup>
            <ButtonGroup>
              {TYPE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={gearType === option.value ? "default" : "outline"}
                  onClick={() => setGearType(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </ButtonGroup>
            {isValidating && (
              <Loader className="text-muted-foreground h-4 w-4 animate-spin" />
            )}
          </div>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          Rows
          <Select
            value={String(perPage)}
            onValueChange={(value) => setPerPage(Number(value))}
          >
            <SelectTrigger className="h-9 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive-foreground rounded-xl border p-6 text-sm">
          Failed to load trending data. Please try again in a moment.
        </div>
      ) : (
        <>
          {showLiveBoostBanner ? (
            <div className="text-muted-foreground mb-2 text-xs">
              Includes same-day live boosts
            </div>
          ) : null}
          <div className="bg-background overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground w-12">
                    #
                  </TableHead>
                  <TableHead className="text-muted-foreground">Gear</TableHead>
                  <TableHead className="text-muted-foreground">Heat</TableHead>
                  <TableHead className="text-muted-foreground">
                    Views ({timeframe})
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Views (lifetime)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TrendingRow
                    key={row.gearId}
                    row={row}
                    index={(page - 1) * perPage + idx + 1}
                    filledCount={getFlameFill(row.score, topScore)}
                    liveDelta={row.liveBoost ?? 0}
                  />
                ))}
                {!rows.length && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-16 text-center"
                    >
                      No gear matches this filter yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="border-border flex items-center justify-center border-t px-4 py-4">
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (!prevDisabled) handlePageChange("prev");
                      }}
                      className={
                        prevDisabled ? "pointer-events-none opacity-40" : ""
                      }
                    />
                  </PaginationItem>
                  {paginationItems.map((item, idx) => {
                    if (item === "ellipsis") {
                      return (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    const pageNumber = item;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          size="default"
                          isActive={pageNumber === page}
                          onClick={(event) => {
                            event.preventDefault();
                            if (pageNumber !== page) {
                              setPage(pageNumber);
                            }
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (!nextDisabled) handlePageChange("next");
                      }}
                      className={
                        nextDisabled ? "pointer-events-none opacity-40" : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function TrendingRow({
  row,
  index,
  filledCount,
  liveDelta = 0,
}: {
  row: TrendingEntry;
  index: number;
  filledCount: number;
  liveDelta?: number;
}) {
  const zebraClass =
    "group border-border/50 bg-background px-4 py-2 transition-colors hover:bg-zinc-200/70 dark:hover:bg-accent/50 even:bg-accent/20";
  const cellBase = "px-4 py-2";
  const { add, contains, isFull, acceptsType } = useCompare();
  const already = contains(row.slug);
  const wrongType = !acceptsType(row.gearType);
  const compareDisabled = already || isFull || wrongType;

  return (
    <TableRow className={zebraClass}>
      <TableCell
        className={cn(cellBase, "text-muted-foreground font-mono text-sm")}
      >
        {index}
      </TableCell>
      <TableCell className={cellBase}>
        <Link
          href={`/gear/${row.slug}`}
          className="hover:bg-muted/40 flex items-center gap-3 rounded-md transition-colors"
        >
          {row.thumbnailUrl ? (
            <Image
              src={row.thumbnailUrl}
              alt={row.name}
              width={48}
              height={48}
              className="rounded-md object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex h-12 w-12 items-center justify-center rounded-md text-xs tracking-wide uppercase">
              <ImageOff className="text-foreground/20 h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-foreground truncate font-medium">{row.name}</p>
          </div>
        </Link>
      </TableCell>
      <TableCell className={cellBase}>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Flame
              key={i}
              className={
                i < filledCount
                  ? "h-4 w-4 text-orange-400"
                  : "text-muted-foreground/40 h-4 w-4"
              }
            />
          ))}
        </div>
      </TableCell>
      <TableCell className={cn(cellBase, "text-foreground font-medium")}>
        {numberFormatter.format(row.stats.views)}
      </TableCell>
      <TableCell className={cn(cellBase, "text-foreground")}>
        {numberFormatter.format(row.lifetimeViews)}
      </TableCell>
      <TableCell className={cn(cellBase, "w-0 text-right")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem asChild>
              <Button
                asChild
                variant="ghost"
                className="justify-between"
                iconPosition="right"
                icon={<ExternalLink className="h-4 w-4" />}
              >
                <Link target="_blank" href={`/gear/${row.slug}`}>
                  View gear
                </Link>
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              disabled={compareDisabled}
              onSelect={async (event) => {
                event.preventDefault();
                if (compareDisabled) return;
                await add({
                  slug: row.slug,
                  name: row.name,
                  gearType: row.gearType,
                });
              }}
            >
              <Button
                variant="ghost"
                className="w-full justify-between"
                iconPosition="right"
                icon={<Scale className="h-4 w-4" />}
              >
                {already
                  ? "Already in compare"
                  : wrongType
                    ? "Type mismatch"
                    : isFull
                      ? "Compare list full"
                      : "Add to compare"}
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function getFlameFill(score: number, topScore: number) {
  if (!topScore || topScore <= 0) return 0;
  const scaled = (score / topScore) * 3;
  return Math.max(0, Math.min(3, Math.round(scaled)));
}

function buildPaginationItems(page: number, total: number) {
  const items: Array<number | "ellipsis"> = [];

  if (total <= 1) {
    items.push(1);
    return items;
  }

  const pushPage = (value: number) => {
    if (!items.includes(value)) items.push(value);
  };

  pushPage(1);

  const middleStart = Math.max(2, page - 1);
  const middleEnd = Math.min(total - 1, page + 1);

  for (let i = middleStart; i <= middleEnd; i++) {
    pushPage(i);
  }

  pushPage(total);

  const numericItems = items.filter(
    (item): item is number =>
      item === total ||
      item === 1 ||
      (typeof item === "number" && item >= middleStart && item <= middleEnd),
  );

  while (numericItems.length > 3) {
    if (
      Math.abs(numericItems[1]! - page) >
      Math.abs(numericItems[numericItems.length - 2]! - page)
    ) {
      numericItems.splice(1, 1);
    } else {
      numericItems.splice(numericItems.length - 2, 1);
    }
  }

  numericItems.sort((a, b) => a - b);

  const finalItems: Array<number | "ellipsis"> = [];
  for (let i = 0; i < numericItems.length; i++) {
    const current = numericItems[i]!;
    const prev = numericItems[i - 1];

    if (prev && current - prev > 1) {
      finalItems.push("ellipsis");
    }

    finalItems.push(current);
  }

  return finalItems;
}
