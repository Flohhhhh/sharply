"use client";

import { CircleQuestionMark, EyeIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { actionToggleOwnership } from "~/server/gear/actions";
import type { GearItem } from "~/types/gear";
import { toast } from "sonner";

export function CollectionCard(props: { item: GearItem; isOwner?: boolean }) {
  const { item, isOwner = false } = props;
  const [removing, setRemoving] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    setDialogOpen(false);
    const promise = actionToggleOwnership(item.slug, "remove");
    toast.promise(promise, {
      loading: "Removing from collection...",
      success: "Removed from collection",
      error: "Failed to remove from collection",
    });
    await promise;
    setRemoving(false);
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
          {isOwner && (
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  icon={<TrashIcon className="h-4 w-4" />}
                  className="pointer-events-auto hover:cursor-pointer"
                  disabled={removing}
                >
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove from collection?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove "{item.name}" from your
                    collection? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={removing}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemove}
                    disabled={removing}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      <div className="text-foreground max-w-[240px] text-2xl leading-snug font-semibold">
        {item.name}
      </div>
    </div>
  );
}
