"use client";

import { useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { actionToggleWishlist } from "~/server/gear/actions";

interface WishlistRemoveButtonProps {
  slug: string;
  gearName?: string;
  onRemoved?: () => void;
  onUndo?: () => void;
}

// Removes an item from the wishlist and refreshes the profile list
export function WishlistRemoveButton({
  slug,
  gearName,
  onRemoved,
  onUndo,
}: WishlistRemoveButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isUndoInFlightRef = useRef(false);

  const handleRemoveClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);

    const gearNameLabel = gearName ?? "Item";
    const togglePromise = actionToggleWishlist(slug, "remove");

    toast.promise(togglePromise, {
      loading: `Removing ${gearNameLabel}...`,
      success: () => ({
        message: `${gearNameLabel} removed from wishlist`,
        action: {
          label: "Undo",
          onClick: async () => {
            if (isUndoInFlightRef.current) return;
            isUndoInFlightRef.current = true;
            try {
              await actionToggleWishlist(slug, "add");
              onUndo?.();
              router.refresh();
            } finally {
              isUndoInFlightRef.current = false;
            }
          },
        },
      }),
      error: `Failed to update wishlist`,
    });

    try {
      const response = await togglePromise;
      if (response?.ok && response.action === "removed") {
        onRemoved?.();
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      className="bg-background/80 text-muted-foreground shadow-sm backdrop-blur hover:bg-background hover:text-foreground"
      onClick={handleRemoveClick}
      loading={isLoading}
      aria-label="Remove from wishlist"
    >
      <X className="h-4 w-4" />
    </Button>
  );
}
