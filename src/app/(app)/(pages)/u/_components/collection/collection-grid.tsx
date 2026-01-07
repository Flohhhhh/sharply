"use client";

import { useMemo } from "react";
import type { GearItem } from "~/types/gear";
import { CollectionCard } from "./collection-card";
import { useCompareRowScale } from "~/components/compare/use-compare-row-scale";

function computeColumnCount(itemCount: number) {
	if (itemCount <= 1) {
		return 1;
	}

	if (itemCount <= 4) {
		return itemCount;
	}

	if (itemCount <= 9) {
		return Math.min(itemCount, 4);
	}

	const wideBias = Math.ceil(Math.sqrt(itemCount) * 1.3);
	const minimalWideColumns = Math.max(6, wideBias);
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

function parseWidthMillimeters(rawWidth: unknown): number | null {
	if (rawWidth == null) return null;
	if (typeof rawWidth === "number")
		return Number.isNaN(rawWidth) ? null : rawWidth;
	if (typeof rawWidth === "string") {
		const value = Number(rawWidth);
		return Number.isNaN(value) ? null : value;
	}
	return null;
}

export function CollectionGrid(props: { items: GearItem[] }) {
	const { items } = props;

	const { pixelsPerMillimeter } = useCompareRowScale({
		items: items.map((item) => ({
			widthMillimeters: parseWidthMillimeters(item.widthMm),
		})),
		basePixelsPerMillimeter: 1.6,
	});

	const displayMetaById = useMemo(() => {
		const fallbackWidthMillimeters = 140;
		const nonCameraWidthPixels = 240;
		const nonCameraHeightPixels = 200;

		return new Map(
			items.map((item) => {
				const widthMillimeters = parseWidthMillimeters(item.widthMm);
				const isCamera =
					item.gearType === "CAMERA" || item.gearType === "ANALOG_CAMERA";
				const displayWidthPixels = isCamera
					? (widthMillimeters ?? fallbackWidthMillimeters) * pixelsPerMillimeter
					: nonCameraWidthPixels;

				return [
					item.id,
					{
						displayWidthPixels,
						isScaleEstimated: isCamera && widthMillimeters == null,
						useFixedHeight: !isCamera,
						fixedHeightPixels: !isCamera ? nonCameraHeightPixels : undefined,
					},
				] as const;
			}),
		);
	}, [items, pixelsPerMillimeter]);

	const rows = useMemo(() => {
		const cameras = items.filter(
			(item) =>
				item.gearType === "CAMERA" || item.gearType === "ANALOG_CAMERA",
		);
		const others = items.filter(
			(item) =>
				item.gearType !== "CAMERA" && item.gearType !== "ANALOG_CAMERA",
		);

		const otherCount = others.length;
		const otherRows =
			otherCount === 0
				? []
				: (() => {
						const columnCount = computeColumnCount(otherCount);
						const rowCounts = computeRowCountsPyramidDown(
							otherCount,
							columnCount,
						);
						return splitItemsByRowCounts(others, rowCounts);
					})();

		return cameras.length > 0 ? [cameras, ...otherRows] : otherRows;
	}, [items]);

	return (
		<div className="flex w-full flex-col gap-10 md:gap-16">
			{rows.map((rowItems) => (
				<div
					key={rowItems.map((item) => item.id).join("-")}
					className="flex flex-col items-stretch gap-8 md:flex-row md:justify-center md:gap-12"
				>
					{rowItems.map((item) => (
						<div key={item.id} className="w-full md:w-auto">
							<CollectionCard
								item={item}
								displayWidthPixels={
									displayMetaById.get(item.id)?.displayWidthPixels ?? 200
								}
								isScaleEstimated={
									displayMetaById.get(item.id)?.isScaleEstimated ?? false
								}
								useFixedHeight={
									displayMetaById.get(item.id)?.useFixedHeight ?? false
								}
								fixedHeightPixels={
									displayMetaById.get(item.id)?.fixedHeightPixels
								}
							/>
						</div>
					))}
				</div>
			))}
		</div>
	);
}
