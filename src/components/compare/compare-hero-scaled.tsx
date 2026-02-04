"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { GearItem } from "~/types/gear";
import { cn } from "~/lib/utils";
import { useCompareRowScale } from "./use-compare-row-scale";
import { useGearDisplayName } from "~/lib/hooks/useGearDisplayName";

type CompareHeroScaledRowProps = {
  leftItem: GearItem | null;
  rightItem: GearItem | null;
};

export function CompareHeroScaledRow({
  leftItem,
  rightItem,
}: CompareHeroScaledRowProps) {
  const isCameraComparison =
    leftItem?.gearType === "CAMERA" && rightItem?.gearType === "CAMERA";
  const leftWidthMillimeters = parseWidthMillimeters(leftItem?.widthMm);
  const rightWidthMillimeters = parseWidthMillimeters(rightItem?.widthMm);
  const hasMissingWidth =
    isCameraComparison &&
    (leftWidthMillimeters == null || rightWidthMillimeters == null);

  const { containerRef, pixelsPerMillimeter } = useCompareRowScale({
    items: [
      { widthMillimeters: leftWidthMillimeters },
      { widthMillimeters: rightWidthMillimeters },
    ],
  });

  const fallbackWidthMillimeters = 140;

  const { leftDisplayWidthPixels, rightDisplayWidthPixels } = useMemo(() => {
    // Only apply physical scaling for camera-to-camera comparisons.
    // For lenses or mixed types, use a constant display width to avoid implying scale.
    if (!isCameraComparison) {
      const constantWidthPixels =
        fallbackWidthMillimeters * pixelsPerMillimeter;
      return {
        leftDisplayWidthPixels: constantWidthPixels,
        rightDisplayWidthPixels: constantWidthPixels,
      };
    }

    const computeCameraWidth = (widthMm: number | null) => {
      const mm = widthMm ?? fallbackWidthMillimeters;
      return mm * pixelsPerMillimeter;
    };
    return {
      leftDisplayWidthPixels: computeCameraWidth(leftWidthMillimeters),
      rightDisplayWidthPixels: computeCameraWidth(rightWidthMillimeters),
    };
  }, [
    leftWidthMillimeters,
    rightWidthMillimeters,
    pixelsPerMillimeter,
    isCameraComparison,
  ]);

  return (
    <div className="space-y-3">
      {hasMissingWidth ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Images are not to scale because width specs are missing.
        </div>
      ) : null}

      <div ref={containerRef} className="relative grid grid-cols-2 gap-4">
        <CompareHeroScaledImage
          item={leftItem}
          displayWidthPixels={leftDisplayWidthPixels}
          side="left"
        />
        <CompareHeroScaledImage
          item={rightItem}
          displayWidthPixels={rightDisplayWidthPixels}
          side="right"
        />
        <div className="pointer-events-none absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:flex">
          <div className="bg-foreground text-background flex h-16 w-16 items-center justify-center rounded-full text-base font-semibold tracking-wide uppercase">
            vs
          </div>
        </div>
      </div>
    </div>
  );
}

type CompareHeroScaledImageProps = {
  item: GearItem | null;
  side: "left" | "right";
  displayWidthPixels: number;
};

function CompareHeroScaledImage({
  item,
  side,
  displayWidthPixels,
}: CompareHeroScaledImageProps) {
  const hasImage = Boolean(item?.thumbnailUrl);
  const displayName = useGearDisplayName({
    name: item?.name ?? "Gear thumbnail",
    regionalAliases: item?.regionalAliases ?? null,
  });
  const alignment =
    side === "left" ? "justify-end pr-4 sm:pr-8" : "justify-start pl-4 sm:pl-8";
  const framePaddingPixels = 20;
  const totalWidth = Math.max(displayWidthPixels + framePaddingPixels * 2, 120);

  return (
    <div
      className={cn(
        "from-muted/40 to-background relative -z-10 flex items-end overflow-hidden rounded-3xl bg-gradient-to-b",
        alignment,
      )}
      style={{ minHeight: "16rem" }}
    >
      <div className="flex h-full w-full items-end justify-center">
        <div
          className="relative"
          style={{
            width: `${totalWidth}px`,
            padding: `${framePaddingPixels}px`,
          }}
        >
          {hasImage ? (
            <img
              src={item?.thumbnailUrl ?? "/image-temp.png"}
              alt={displayName}
              style={{
                width: `${displayWidthPixels}px`,
                height: "auto",
                objectFit: "contain",
              }}
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs tracking-wide uppercase">
              Image coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
