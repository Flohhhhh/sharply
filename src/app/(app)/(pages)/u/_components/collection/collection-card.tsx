"use client";

import { CircleQuestionMark, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { actionToggleOwnership } from "~/server/gear/actions";
import type { GearItem } from "~/types/gear";
import { toast } from "sonner";

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
  const [removing, setRemoving] = useState<boolean>(false);

  const handleUndo = async () => {
    if (removing) return;
    setRemoving(true);

    const undoPromise = actionToggleOwnership(item.slug, "add");
    toast.promise(undoPromise, {
      loading: `Adding ${item.name}...`,
      success: `Added ${item.name}`,
      error: `Failed to restore ${item.name}`,
    });

    try {
      await undoPromise;
    } finally {
      setRemoving(false);
    }
  };

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);

    const promise = actionToggleOwnership(item.slug, "remove");
    toast.promise(promise, {
      loading: `Removing ${item.name}...`,
      success: () => ({
        message: `Removed Successfully`,
        description: `${item.name} was removed from your collection`,
        duration: 12000,
        action: {
          label: "Undo",
          onClick: () => {
            void handleUndo();
          },
        },
      }),
      error: `Failed to remove ${item.name}`,
    });

    try {
      await promise;
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="group relative">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
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
            className="transition-all duration-200 group-hover:scale-105 group-hover:opacity-50"
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

        <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleRemove}
            disabled={removing}
            className="pointer-events-auto shadow-md"
          >
            <TrashIcon className="h-4 w-4" />
            <span className="sr-only">Remove from collection</span>
          </Button>
        </div>
      </div>
      <Link
        href={`/gear/${item.slug}`}
        className="text-foreground hover:text-foreground/80 max-w-[240px] text-2xl leading-snug font-semibold transition-colors"
      >
        {item.name}
      </Link>
      {(item.gearType === "CAMERA" || item.gearType === "ANALOG_CAMERA") &&
        isScaleEstimated ? (
        <p className="text-muted-foreground text-xs">
          Scale approximate (missing width spec)
        </p>
      ) : null}
    </div>
  );
}
