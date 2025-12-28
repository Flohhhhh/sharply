"use client";

import { useMemo } from "react";
import type { GearItem } from "~/types/gear";
import { CollectionCard } from "./collection-card";

function computeColumnCount(itemCount: number) {
  if (itemCount <= 1) {
    return 1;
  }

  const minimalWideColumns = Math.max(4, Math.ceil(Math.sqrt(itemCount)));
  return Math.min(itemCount, minimalWideColumns);
}

function computeRowCountsPyramidDown(itemCount: number, columnCount: number) {
  if (itemCount === 0) {
    return [];
  }

  const rowCount = Math.ceil(itemCount / columnCount);
  const baseItemCountPerRow = Math.floor(itemCount / rowCount);
  const remainderItemCount = itemCount % rowCount;

  const rowCounts = Array.from({ length: rowCount }, (_, rowIndex) => {
    const extraItemForThisRow = rowIndex < remainderItemCount ? 1 : 0;
    return baseItemCountPerRow + extraItemForThisRow;
  });

  rowCounts.sort(
    (firstRowCount, secondRowCount) => firstRowCount - secondRowCount,
  );
  return rowCounts;
}

function splitItemsByRowCounts<T>(items: T[], rowCounts: number[]) {
  const rows: T[][] = [];
  let itemStartIndex = 0;

  for (const rowItemCount of rowCounts) {
    const rowItems = items.slice(itemStartIndex, itemStartIndex + rowItemCount);
    rows.push(rowItems);
    itemStartIndex += rowItemCount;
  }

  return rows;
}

export function CollectionGrid(props: { items: GearItem[]; isOwner?: boolean }) {
  const { items, isOwner = false } = props;

  const rows = useMemo(() => {
    const itemCount = items.length;
    if (itemCount === 0) {
      return [];
    }

    const columnCount = computeColumnCount(itemCount);
    const rowCounts = computeRowCountsPyramidDown(itemCount, columnCount);
    return splitItemsByRowCounts(items, rowCounts);
  }, [items]);

  return (
    <div className="flex w-full flex-col gap-6 md:gap-10">
      {rows.map((rowItems, rowIndex) => (
        <div
          key={rowIndex}
          className="flex flex-col items-stretch gap-6 md:flex-row md:justify-center md:gap-10"
        >
          {rowItems.map((item) => (
            <div key={item.id} className="w-full md:w-auto">
              <CollectionCard item={item} isOwner={isOwner} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
