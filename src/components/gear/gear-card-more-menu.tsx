"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Check,
  Heart,
  MoreVertical,
  PackageOpen,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "~/lib/auth/auth-client";
import { buildCompareHref } from "~/lib/utils/url";
import { cn } from "~/lib/utils";
import { actionToggleOwnership, actionToggleWishlist } from "~/server/gear/actions";
import { actionRecordCompareAdd } from "~/server/popularity/actions";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  GearSearchCombobox,
  type GearOption,
} from "./gear-search-combobox";
import { SaveItemButton } from "./save-item-button";

type SavePickerState = {
  lists: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    itemCount: number;
  }>;
  savedListIds: string[];
  defaultListId: string | null;
} | null;

type GearCardMoreMenuProps = {
  slug: string;
  displayName: string;
  gearType?: string | null;
  mode?: "inline" | "overlay";
};

export function GearCardMoreMenu({
  slug,
  displayName,
  gearType,
  mode = "inline",
}: GearCardMoreMenuProps) {
  const { data } = useSession();
  const router = useRouter();
  const session = data?.session;
  const [inWishlist, setInWishlist] = useState<boolean | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [statusFetched, setStatusFetched] = useState(false);
  const [saveState, setSaveState] = useState<SavePickerState>(null);
  const [isOwned, setIsOwned] = useState<boolean | null>(null);
  const [ownershipLoading, setOwnershipLoading] = useState(false);
  const [compareSelection, setCompareSelection] = useState<GearOption | null>(
    null,
  );

  useEffect(() => {
    if (!session || statusFetched) return;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(
          `/api/gear/${encodeURIComponent(slug)}/user-state`,
        );
        if (!response.ok) return;
        const payload = (await response.json()) as {
          inWishlist: boolean | null;
          isOwned: boolean | null;
          saveState: SavePickerState;
        };
        if (cancelled) return;
        setInWishlist(payload.inWishlist);
        setIsOwned(payload.isOwned);
        setSaveState(payload.saveState);
        setStatusFetched(true);
      } catch {
        // Ignore background state fetch errors; actions still work.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, slug, statusFetched]);

  if (!session) return null;

  const handleMenuButtonClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleAddToWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (wishlistLoading) return;

    setWishlistLoading(true);
    const action = inWishlist ? "remove" : "add";

    try {
      const result = await actionToggleWishlist(slug, action);
      if (result.ok) {
        setInWishlist(result.action === "added");
        toast.success(
          result.action === "added"
            ? "Added to wishlist"
            : "Removed from wishlist",
        );
      }
    } catch {
      toast.error("Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCollection = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (ownershipLoading) return;

    setOwnershipLoading(true);
    try {
      const action = isOwned ? "remove" : "add";
      const result = await actionToggleOwnership(slug, action);
      if (result.ok) {
        const ownedNow = result.action === "added";
        setIsOwned(ownedNow);
        toast.success(
          ownedNow ? "Added to collection" : "Removed from collection",
        );
      } else if (result.reason === "already_owned") {
        setIsOwned(true);
        toast.info("Already in collection");
      } else {
        toast.error("Failed to update collection");
      }
    } catch {
      toast.error("Failed to update collection");
    } finally {
      setOwnershipLoading(false);
    }
  };

  const handleOpenCompare = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setCompareOpen(true);
  };

  const handleOpenSave = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSaveOpen(true);
  };

  const handleCompareSelect = async (option: GearOption | null) => {
    if (!option) return;
    setCompareOpen(false);
    try {
      await actionRecordCompareAdd({ slug: option.slug });
    } catch {
      // Ignore compare analytics failures.
    }
    router.push(buildCompareHref([slug, option.slug]));
  };

  const triggerVariant = mode === "overlay" ? "secondary" : "ghost";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={triggerVariant}
            size="icon"
            className={cn(
              "size-8 shrink-0 rounded-full",
              mode === "overlay" && "shadow-md",
            )}
            onClick={handleMenuButtonClick}
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" sideOffset={6}>
          <DropdownMenuItem onClick={handleOpenSave}>
            <Bookmark className="size-4" />
            Save
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleAddToWishlist}
            disabled={wishlistLoading}
          >
            <Heart className={cn("size-4", inWishlist === true && "fill-current")} />
            {inWishlist === true ? "Remove from Wishlist" : "Add to Wishlist"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleAddToCollection}
            disabled={ownershipLoading}
          >
            {isOwned ? (
              <Check className="size-4" />
            ) : (
              <PackageOpen className="size-4" />
            )}
            {isOwned ? "Remove from Collection" : "Add to Collection"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenCompare}>
            <Scale className="size-4" />
            Compare
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compare {displayName}</DialogTitle>
            <DialogDescription>
              Select another item to compare with {displayName}
            </DialogDescription>
          </DialogHeader>
          <GearSearchCombobox
            value={compareSelection}
            setValue={setCompareSelection}
            onSelectionChange={handleCompareSelect}
            filters={gearType ? { gearType } : undefined}
            excludeIds={[slug]}
            placeholder="Search for gear..."
            searchPlaceholder="Search gear to compare"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save {displayName}</DialogTitle>
          </DialogHeader>
          <SaveItemButton
            slug={slug}
            initialState={saveState}
            onStateChange={(nextState) => setSaveState(nextState)}
            mode="list"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
