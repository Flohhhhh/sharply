"use client";

import { CircleQuestionMark, EyeIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { actionToggleOwnership } from "~/server/gear/actions";
import type { GearItem } from "~/types/gear";
import { toast } from "sonner";

export function CollectionCard(props: { item: GearItem }) {
  const { item } = props;
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
            className="h-[200px] w-full object-contain transition-all duration-200 group-hover:scale-105 group-hover:opacity-50"
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

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            asChild
            icon={<EyeIcon className="h-4 w-4" />}
            className="pointer-events-auto hover:cursor-pointer"
          >
            <Link href={`/gear/${item.slug}`}>View</Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleRemove}
            icon={<TrashIcon className="h-4 w-4" />}
            className="pointer-events-auto hover:cursor-pointer"
          >
            Remove
          </Button>
        </div>
      </div>
      <div className="text-foreground max-w-[240px] text-2xl leading-snug font-semibold">
        {item.name}
      </div>
    </div>
  );
}
