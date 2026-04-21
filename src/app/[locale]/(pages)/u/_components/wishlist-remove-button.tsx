"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef,useState,type MouseEvent } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
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
  const t = useTranslations("userProfile");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isUndoInFlightRef = useRef(false);

  const handleRemoveClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);

    const gearNameLabel = gearName ?? t("itemFallback");
    const togglePromise = actionToggleWishlist(slug, "remove");

    toast.promise(togglePromise, {
      loading: t("removingWishlistItem", { name: gearNameLabel }),
      success: () => ({
        message: t("removedFromWishlist", { name: gearNameLabel }),
        action: {
          label: t("undo"),
          onClick: () => {
            if (isUndoInFlightRef.current) return;
            isUndoInFlightRef.current = true;
            void (async () => {
              try {
                await actionToggleWishlist(slug, "add");
                onUndo?.();
                router.refresh();
              } finally {
                isUndoInFlightRef.current = false;
              }
            })();
          },
        },
      }),
      error: t("failedToUpdateWishlist"),
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
      className="bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground shadow-sm backdrop-blur"
      onClick={(event) => {
        void handleRemoveClick(event);
      }}
      loading={isLoading}
      aria-label={t("removeFromWishlist")}
    >
      <X className="h-4 w-4" />
    </Button>
  );
}
