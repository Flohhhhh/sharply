"use client";
// (client component) will contain our column definitions.

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminGearTableRow } from "~/types/gear";
import Link from "next/link";
import { formatHumanDate } from "~/lib/utils";
import { RenameGearDialog } from "~/components/gear/rename-gear-dialog";
import { Button } from "~/components/ui/button";
import { Pencil } from "lucide-react";

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
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <RenameGearDialog
          gearId={row.original.id}
          currentName={row.original.name}
          currentSlug={row.original.slug}
          trigger={
            <Button variant="ghost" size="sm">
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
      );
    },
  },
];
