"use client";

import {
  Bookmark,
  Check,
  Heart,
  MoreVertical,
  PackageOpen,
  Scale,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback,useEffect,useRef,useState } from "react";
import { toast } from "sonner";
import { useSession } from "~/lib/auth/auth-client";
import { cn } from "~/lib/utils";
import { buildCompareHref } from "~/lib/utils/url";
import { actionToggleOwnership,actionToggleWishlist } from "~/server/gear/actions";
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
  onOpenChange?: (open: boolean) => void;
};

export function GearCardMoreMenu({
  slug,
  displayName,
  gearType,
  onOpenChange,
}: GearCardMoreMenuProps) {
  const { data } = useSession();
  const router = useRouter();
  const session = data?.session;
  const activeUserId = session?.userId ?? null;
  const fetchKey = activeUserId ? `${activeUserId}:${slug}` : null;
  const [inWishlist, setInWishlist] = useState<boolean | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [fetchedKey, setFetchedKey] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SavePickerState>(null);
  const [isOwned, setIsOwned] = useState<boolean | null>(null);
  const [ownershipLoading, setOwnershipLoading] = useState(false);
  const [compareSelection, setCompareSelection] = useState<GearOption | null>(
    null,
  );
  const inFlightUserStateRequestsRef = useRef<Map<string, Promise<void>>>(
    new Map(),
  );
  const currentFetchKeyRef = useRef<string | null>(fetchKey);
  currentFetchKeyRef.current = fetchKey;

  const ensureUserStateLoaded = useCallback(async () => {
    if (!fetchKey || fetchedKey === fetchKey) return;

    const existingRequest = inFlightUserStateRequestsRef.current.get(fetchKey);
    if (existingRequest) {
      await existingRequest;
      return;
    }

    const request = (async () => {
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
        if (currentFetchKeyRef.current !== fetchKey) {
          return;
        }
        setInWishlist(payload.inWishlist);
        setIsOwned(payload.isOwned);
        setSaveState(payload.saveState);
        setFetchedKey(fetchKey);
      } catch {
        // Ignore background state fetch errors; actions still work.
      } finally {
        inFlightUserStateRequestsRef.current.delete(fetchKey);
      }
    })();

    inFlightUserStateRequestsRef.current.set(fetchKey, request);

    await request;
  }, [fetchKey, fetchedKey, slug]);

  useEffect(() => {
    if (!fetchKey) {
      setFetchedKey(null);
      setInWishlist(null);
      setIsOwned(null);
      setSaveState(null);
      return;
    }

    if (fetchedKey && fetchedKey !== fetchKey) {
      setFetchedKey(null);
      setInWishlist(null);
      setIsOwned(null);
      setSaveState(null);
    }
  }, [fetchKey, fetchedKey]);

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
      } else if (result.reason === "already_in_wishlist") {
        setInWishlist(true);
        toast.error("Already in wishlist");
      } else if (result.reason === "not_in_wishlist") {
        setInWishlist(false);
        toast.error("Not in wishlist");
      } else {
        toast.error("Failed to update wishlist");
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
    void ensureUserStateLoaded();
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

  return (
    <>
      <DropdownMenu
        onOpenChange={(open) => {
          onOpenChange?.(open);
          if (open) {
            void ensureUserStateLoaded();
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className={cn("size-8 shrink-0 rounded-full shadow-md")}
            onClick={handleMenuButtonClick}
            onMouseEnter={() => void ensureUserStateLoaded()}
            onFocus={() => void ensureUserStateLoaded()}
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
