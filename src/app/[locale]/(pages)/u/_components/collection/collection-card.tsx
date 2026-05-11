"use client";

import { CircleQuestionMark } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useGearDisplayName } from "~/lib/hooks/useGearDisplayName";
import type { GearItem } from "~/types/gear";
import { getCollectionCardWidthPixels } from "./collection-layout";

export function CollectionCard(props: {
  item: GearItem;
  displayWidthPixels: number;
  displayHeightPixels: number;
  isScaleEstimated: boolean;
  useFixedHeight: boolean;
  fixedHeightPixels?: number;
  imageStageHeightPixels: number;
}) {
  const {
    item,
    displayWidthPixels,
    displayHeightPixels,
    isScaleEstimated,
    useFixedHeight,
    fixedHeightPixels,
    imageStageHeightPixels,
  } = props;
  const displayName = useGearDisplayName({
    name: item.name,
    regionalAliases: item.regionalAliases,
  });
  const cardWidthPixels = getCollectionCardWidthPixels(displayWidthPixels);
  const imageHeightPixels = Math.max(Math.round(displayHeightPixels), 1);
  const imageWidthPixels = Math.max(Math.round(displayWidthPixels), 120);
  const stageHeightPixels = Math.max(
    Math.round(imageStageHeightPixels),
    fixedHeightPixels ?? 0,
    1,
  );

  return (
    <div
      className="flex max-w-full flex-col items-center gap-3 text-center"
      style={{ width: `${cardWidthPixels}px` }}
    >
      <Link
        href={`/gear/${item.slug}`}
        className="group relative flex w-full cursor-pointer items-end justify-center"
        style={{ height: `${stageHeightPixels}px` }}
      >
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={displayName}
            width={imageWidthPixels}
            height={imageHeightPixels}
            unoptimized
            style={
              useFixedHeight
                ? {
                    height: `${fixedHeightPixels ?? 200}px`,
                    width: "auto",
                    maxWidth: `${cardWidthPixels}px`,
                    objectFit: "contain",
                    objectPosition: "center",
                  }
                : {
                    width: `${imageWidthPixels}px`,
                    height: `${imageHeightPixels}px`,
                    maxWidth: "100%",
                    objectFit: "contain",
                    objectPosition: "center bottom",
                  }
            }
            className="block transition-all duration-200 group-hover:scale-105"
            draggable={false}
          />
        ) : (
          <div
            className="bg-muted/50 flex w-full items-center justify-center rounded-full"
            style={{ height: `${stageHeightPixels}px` }}
          >
            <CircleQuestionMark
              className="text-muted-foreground/50 size-8"
              aria-hidden
            />
          </div>
        )}
      </Link>
      <div className="text-foreground w-full max-w-[240px] text-2xl leading-snug font-semibold">
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
