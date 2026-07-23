"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import type { Column, ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { formatGearCardDate } from "~/components/gear/gear-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useGearDisplayName } from "~/lib/hooks/useGearDisplayName";
import { formatFocalLengthRangeDisplay } from "~/lib/mapping/focal-length-map";
import { getItemDisplayPrice } from "~/lib/mapping/price-map";
import {
  compareNullable,
  getEffectiveDateValue,
  getEffectivePrice,
} from "./gear-table-helpers";
import type { GearTableRow, GearTableScope } from "./gear-table-types";

export type GearTableLabels = {
  name: string;
  brand: string;
  mount: string;
  sensorFormat: string;
  megapixels: string;
  year: string;
  weight: string;
  price: string;
  focalLength: string;
  aperture: string;
  type: string;
  prime: string;
  zoom: string;
  camera: string;
  lens: string;
  sortAscending: (values: { column: string }) => string;
  sortDescending: (values: { column: string }) => string;
};

const EMPTY_VALUE = "—";

function MutedValue({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

function formatAperture(value: number | null, tele: number | null) {
  if (value == null && tele == null) return EMPTY_VALUE;
  const format = (input: number) =>
    Number(input)
      .toFixed(2)
      .replace(/\.0+$/, "")
      .replace(/(\.\d*[1-9])0+$/, "$1");
  if (value == null) return `f/${format(tele!)}`;
  if (tele == null || value === tele) return `f/${format(value)}`;
  return `f/${format(value)}-${format(tele)}`;
}

function SortableHeader({
  column,
  label,
  labels,
}: {
  column: Column<GearTableRow, unknown>;
  label: string;
  labels: GearTableLabels;
}) {
  const direction = column.getIsSorted();
  const nextLabel =
    direction === "asc"
      ? labels.sortDescending({ column: label })
      : labels.sortAscending({ column: label });
  const Icon =
    direction === "asc"
      ? ArrowUp
      : direction === "desc"
        ? ArrowDown
        : ArrowUpDown;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 px-3"
          aria-label={nextLabel}
          aria-sort={
            direction === false
              ? "none"
              : direction === "asc"
                ? "ascending"
                : "descending"
          }
          onClick={() => column.toggleSorting(direction === "asc")}
        >
          {label}
          <Icon className="ml-1 size-3.5" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{nextLabel}</TooltipContent>
    </Tooltip>
  );
}

function GearNameCell({ row }: { row: GearTableRow }) {
  const displayName = useGearDisplayName(row);
  return (
    <Link href={`/gear/${row.slug}`} className="font-medium hover:underline">
      {displayName}
    </Link>
  );
}

function GearYearCell({ row }: { row: GearTableRow }) {
  const locale = useLocale();
  return (
    <MutedValue>
      {formatGearCardDate(
        row.releaseDate ?? row.announcedDate,
        row.releaseDatePrecision ?? row.announceDatePrecision,
        locale,
      ) || EMPTY_VALUE}
    </MutedValue>
  );
}

function LensTypePill({
  isPrime,
  labels,
}: {
  isPrime: boolean | null;
  labels: Pick<GearTableLabels, "prime" | "zoom">;
}) {
  if (isPrime == null) return EMPTY_VALUE;

  return (
    <Badge
      variant="outline"
      className={
        isPrime
          ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
          : "border-sky-500/25 bg-sky-500/12 text-sky-700 dark:text-sky-300"
      }
    >
      {isPrime ? labels.prime : labels.zoom}
    </Badge>
  );
}

export function createGearTableColumns(
  scope: GearTableScope,
  labels: GearTableLabels,
): ColumnDef<GearTableRow, unknown>[] {
  const sortable = (
    id: string,
    label: string,
    cell: (row: GearTableRow) => ReactNode,
    sortingFn?: ColumnDef<GearTableRow, unknown>["sortingFn"],
  ): ColumnDef<GearTableRow, unknown> => ({
    id,
    accessorFn: (row) => row[id as keyof GearTableRow],
    header: ({ column }) => (
      <SortableHeader column={column} label={label} labels={labels} />
    ),
    cell: ({ row }) => cell(row.original),
    sortingFn,
  });

  const common = [
    sortable(
      "name",
      labels.name,
      (row) => <GearNameCell row={row} />,
      (a, b) => a.original.name.localeCompare(b.original.name),
    ),
    sortable(
      "brandName",
      labels.brand,
      (row) => <MutedValue>{row.brandName ?? EMPTY_VALUE}</MutedValue>,
      (a, b) =>
        compareNullable(
          a.original.brandName,
          b.original.brandName,
          (left, right) => left.localeCompare(right),
        ),
    ),
    sortable(
      "mountNames",
      labels.mount,
      (row) => (
        <MutedValue>{row.mountNames.join(", ") || EMPTY_VALUE}</MutedValue>
      ),
      (a, b) =>
        compareNullable(
          a.original.mountNames.join(", ") || null,
          b.original.mountNames.join(", ") || null,
          (left, right) => left.localeCompare(right),
        ),
    ),
  ];
  const year = sortable(
    "year",
    labels.year,
    (row) => <GearYearCell row={row} />,
    (a, b) =>
      compareNullable(
        getEffectiveDateValue(a.original),
        getEffectiveDateValue(b.original),
        (left, right) => left - right,
      ),
  );
  const price = sortable(
    "price",
    labels.price,
    (row) =>
      getItemDisplayPrice(row, { style: "short", padWholeAmounts: true }),
    (a, b) =>
      compareNullable(
        getEffectivePrice(a.original),
        getEffectivePrice(b.original),
        (left, right) => left - right,
      ),
  );

  if (scope === "camera") {
    return [
      ...common,
      sortable(
        "sensorFormatName",
        labels.sensorFormat,
        (row) => row.sensorFormatName ?? EMPTY_VALUE,
        (a, b) =>
          compareNullable(
            a.original.sensorFormatName,
            b.original.sensorFormatName,
            (left, right) => left.localeCompare(right),
          ),
      ),
      sortable(
        "megapixels",
        labels.megapixels,
        (row) =>
          row.megapixels == null
            ? EMPTY_VALUE
            : `${Number(row.megapixels).toFixed(1).replace(/\.0$/, "")} MP`,
        (a, b) =>
          compareNullable(
            a.original.megapixels,
            b.original.megapixels,
            (left, right) => left - right,
          ),
      ),
      year,
      sortable(
        "weightGrams",
        labels.weight,
        (row) => (
          <MutedValue>
            {row.weightGrams == null ? EMPTY_VALUE : `${row.weightGrams} g`}
          </MutedValue>
        ),
        (a, b) =>
          compareNullable(
            a.original.weightGrams,
            b.original.weightGrams,
            (left, right) => left - right,
          ),
      ),
      price,
    ];
  }
  if (scope === "lens") {
    return [
      ...common,
      sortable(
        "focalLengthMinMm",
        labels.focalLength,
        (row) =>
          formatFocalLengthRangeDisplay({
            min: row.focalLengthMinMm,
            max: row.focalLengthMaxMm,
            isPrime: row.isPrime,
          }).actual ?? EMPTY_VALUE,
        (a, b) =>
          compareNullable(
            a.original.focalLengthMinMm ?? a.original.focalLengthMaxMm,
            b.original.focalLengthMinMm ?? b.original.focalLengthMaxMm,
            (left, right) => left - right,
          ),
      ),
      sortable(
        "maxApertureWide",
        labels.aperture,
        (row) => formatAperture(row.maxApertureWide, row.maxApertureTele),
        (a, b) =>
          compareNullable(
            a.original.maxApertureWide ?? a.original.maxApertureTele,
            b.original.maxApertureWide ?? b.original.maxApertureTele,
            (left, right) => left - right,
          ),
      ),
      sortable(
        "isPrime",
        labels.type,
        (row) => <LensTypePill isPrime={row.isPrime} labels={labels} />,
        (a, b) =>
          compareNullable(
            a.original.isPrime,
            b.original.isPrime,
            (left, right) => Number(left) - Number(right),
          ),
      ),
      year,
      price,
    ];
  }
  return [
    ...common,
    sortable(
      "gearType",
      labels.type,
      (row) => (
        <MutedValue>
          {row.gearType === "LENS"
            ? labels.lens
            : row.gearType === "CAMERA" || row.gearType === "ANALOG_CAMERA"
              ? labels.camera
              : EMPTY_VALUE}
        </MutedValue>
      ),
      (a, b) =>
        compareNullable(
          a.original.gearType,
          b.original.gearType,
          (left, right) => left.localeCompare(right),
        ),
    ),
    year,
    price,
  ];
}
