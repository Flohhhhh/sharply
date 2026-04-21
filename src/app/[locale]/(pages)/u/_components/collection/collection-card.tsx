"use client";

import { CircleQuestionMark } from "lucide-react";
import Link from "next/link";
import type { GearItem } from "~/types/gear";
import { useGearDisplayName } from "~/lib/hooks/useGearDisplayName";

export function CollectionCard(props: {
  item: GearItem;
  displayWidthPixels: number;
  isScaleEstimated: boolean;
  useFixedHeight: boolean;
  fixedHeightPixels?: number;
}) {
  const {
    item,
    displayWidthPixels,
    isScaleEstimated,
    useFixedHeight,
    fixedHeightPixels,
  } = props;
  const displayName = useGearDisplayName({
    name: item.name,
    regionalAliases: item.regionalAliases,
  });

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Link
        href={`/gear/${item.slug}`}
        className="group relative cursor-pointer"
      >
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={displayName}
            style={
              useFixedHeight
                ? {
                    height: `${fixedHeightPixels ?? 200}px`,
                    width: "auto",
                    maxWidth: `${Math.max(140, displayWidthPixels)}px`,
                    objectFit: "contain",
                  }
                : {
                    width: `${Math.max(120, displayWidthPixels)}px`,
                    height: "auto",
                    objectFit: "contain",
                  }
            }
            className="transition-all duration-200 group-hover:scale-105"
            draggable={false}
          />
        ) : (
          <div className="bg-muted/50 flex h-[200px] w-[200px] items-center justify-center rounded-full">
            <CircleQuestionMark
              className="text-muted-foreground/50 size-8"
              aria-hidden
            />
          </div>
        )}
      </Link>
      <div className="text-foreground max-w-[240px] text-2xl leading-snug font-semibold">
        {displayName}
      </div>
      {(item.gearType === "CAMERA" || item.gearType === "ANALOG_CAMERA") &&
      isScaleEstimated ? (
        <p className="text-muted-foreground text-xs">
          Scale approximate (missing width spec)
        </p>
      ) : null}
    </div>
  );
}
