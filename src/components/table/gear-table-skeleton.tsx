"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Skeleton } from "~/components/ui/skeleton";
import type { GearTableScope } from "./gear-table-types";

const COLUMN_COUNTS: Record<GearTableScope, number> = {
  camera: 7,
  lens: 8,
  mixed: 5,
};

const CELL_WIDTHS = ["w-20", "w-28", "w-16", "w-24", "w-12", "w-20"];

export function GearTableSkeleton({
  scope = "mixed",
  rows = 10,
  showHeader = true,
}: {
  scope?: GearTableScope;
  rows?: number;
  showHeader?: boolean;
}) {
  const columns = COLUMN_COUNTS[scope];

  return (
    <div
      aria-hidden
      className="[mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
    >
      <Table>
        {showHeader ? (
          <TableHeader>
            <TableRow className="odd:bg-transparent even:bg-transparent hover:bg-transparent">
              {Array.from({ length: columns }, (_, index) => (
                <TableHead key={`header-${index}`} className="h-auto px-2 py-3">
                  <Skeleton className="h-3 w-16" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        ) : null}
        <TableBody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <TableRow
              key={`row-${rowIndex}`}
              className="odd:bg-transparent even:bg-transparent hover:bg-transparent"
            >
              {Array.from({ length: columns }, (_, columnIndex) => (
                <TableCell
                  key={`cell-${rowIndex}-${columnIndex}`}
                  className="px-2 py-3"
                >
                  <Skeleton
                    className={`h-4 ${
                      CELL_WIDTHS[(rowIndex + columnIndex) % CELL_WIDTHS.length]
                    }`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
