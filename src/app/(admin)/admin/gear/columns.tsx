"use client";
// (client component) will contain our column definitions.

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminGearTableRow } from "~/types/gear";
import Link from "next/link";
import { formatHumanDate } from "~/lib/utils";

// TO ADD A COLUMN:
// 1. Add the field to `adminGearSelect` in `~/server/admin/gear/data.ts`.
//    The `AdminGearTableRow` type is derived automatically from that select.
// 2. Add the column definition below (header/accessor/cell as needed).

export const columns: ColumnDef<AdminGearTableRow>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => {
      return (
        <Link className="hover:underline" href={`/gear/${row.original.slug}`}>
          {row.original.name}
        </Link>
      );
    },
  },
  {
    header: "Slug",
    accessorKey: "slug",
  },
  {
    header: "Brand",
    accessorKey: "brandName",
  },
  {
    header: "Type",
    accessorKey: "gearType",
  },
  {
    header: "Created At",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      return <div>{formatHumanDate(row.original.createdAt)}</div>;
    },
  },
];
