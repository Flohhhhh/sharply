"use client";

import { useState } from "react";
import { useSession } from "~/lib/auth/auth-client";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import {
  Bookmark,
  ChevronDown,
  Heart,
  Package,
  PackageOpen,
} from "lucide-react";
import { toast } from "sonner";
import { withBadgeToasts } from "~/components/badges/badge-toast";
import { CompareButton } from "~/components/compare/compare-button";
import { AddToWishlistButton } from "~/components/gear/add-to-wishlist-button";
import { SaveItemButton } from "~/components/gear/save-item-button";
import { actionToggleOwnership } from "~/server/gear/actions";
import { useGearDisplayName } from "~/lib/hooks/useGearDisplayName";
import type { GearAlias } from "~/types/gear";

interface GearActionButtonsClientProps {
  slug: string;
  name: string;
  regionalAliases?: GearAlias[] | null;
  gearType?: string | null;
  initialIsAuthenticated: boolean;
  initialInWishlist?: boolean | null;
  initialIsOwned?: boolean | null;
  initialSaveState?: {
    lists: Array<{
      id: string;
      name: string;
      isDefault: boolean;
      itemCount: number;
    }>;
    savedListIds: string[];
    defaultListId: string | null;
  } | null;
}

function GearCompareActionButton({
  slug,
  name,
  gearType,
}: Pick<GearActionButtonsClientProps, "slug" | "gearType"> & {
  name: string;
}) {
  return (
    <CompareButton
      slug={slug}
      name={name}
      gearType={gearType}
      size="md"
      variant="outline"
      className="w-full justify-start"
      showLabel
    />
  );
}

export function GearActionButtonsClient({
  slug,
  name,
  regionalAliases,
  gearType,
  initialIsAuthenticated,
  initialInWishlist = null,
  initialIsOwned = null,
  initialSaveState = null,
}: GearActionButtonsClientProps) {
  const { data, isPending } = useSession();
  const displayName = useGearDisplayName({ name, regionalAliases });

  const session = data?.session;
  const callbackUrl = `/gear/${slug}`;
  const signInUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const saveButtonActive = (initialSaveState?.savedListIds.length ?? 0) > 0;
  const wishlistActive = initialInWishlist === true;

  const [isOwned, setIsOwned] = useState<boolean | null>(() => initialIsOwned ?? null);
  const [loading, setLoading] = useState({
    ownership: false,
  });

  // Initial state comes from the server wrapper props; no client fetch

  const handleRequireAuthInteraction = () => {
    if (isPending) return;
    window.location.href = signInUrl;
  };

  const handleOwnershipToggle = async () => {
    if (!session) {
      handleRequireAuthInteraction();
      return;
    }
    if (isOwned === null) return;

    setLoading((prev) => ({ ...prev, ownership: true }));
    try {
      const action = isOwned ? "remove" : ("add" as const);
      const res = await withBadgeToasts(actionToggleOwnership(slug, action));
      if (res.ok) {
        setIsOwned(!isOwned);

        // Optimistic stats update event
        const delta = res.action === "added" ? 1 : -1;
        window.dispatchEvent(
          new CustomEvent("gear:ownership", { detail: { delta, slug } }),
        );

        if (res.action === "added") {
          toast.success("Added to collection");
        } else {
          toast.success("Removed from collection");
        }
      } else {
        toast.error("Failed to update collection");
      }
    } catch {
      toast.error("Failed to update collection");
    } finally {
      setLoading((prev) => ({ ...prev, ownership: false }));
    }
  };

  const renderPendingAuthenticatedButtons = () => (
    <div className="space-y-3 pt-4">
      <ButtonGroup className="w-full">
        <Button
          type="button"
          variant={saveButtonActive ? "default" : "outline"}
          className="flex-1 justify-start"
          disabled
          icon={<Bookmark className={saveButtonActive ? "fill-current" : ""} />}
        >
          {saveButtonActive ? "Saved" : "Save Item"}
        </Button>
        <Button
          type="button"
          variant={saveButtonActive ? "default" : "outline"}
          size="icon"
          disabled
        >
          <ChevronDown className="size-4" />
          <span className="sr-only">Choose list</span>
        </Button>
      </ButtonGroup>

      <Button
        variant={wishlistActive ? "default" : "outline"}
        className="w-full justify-start"
        disabled
        icon={
          wishlistActive ? (
            <Heart className="h-4 w-4 fill-current" />
          ) : (
            <Heart className="h-4 w-4" />
          )
        }
      >
        {wishlistActive ? "Remove from Wishlist" : "Add to Wishlist"}
      </Button>

      <Button
        variant={initialIsOwned ? "default" : "outline"}
        className="w-full justify-start"
        disabled
        icon={initialIsOwned ? <Package /> : <PackageOpen />}
      >
        {initialIsOwned ? "Remove from Collection" : "Add to Collection"}
      </Button>

      <GearCompareActionButton
        slug={slug}
        name={displayName}
        gearType={gearType}
      />
    </div>
  );

  const renderSignedOutButtons = (authButtonsDisabled: boolean) => (
    <div className="space-y-3 pt-4">
      <Button
        variant="outline"
        className="w-full justify-start"
        icon={<Bookmark />}
        onClick={handleRequireAuthInteraction}
        disabled={authButtonsDisabled}
      >
        Save Item
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        icon={<Heart />}
        onClick={handleRequireAuthInteraction}
        disabled={authButtonsDisabled}
      >
        Add to Wishlist
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        icon={<PackageOpen />}
        onClick={handleRequireAuthInteraction}
        disabled={authButtonsDisabled}
      >
        Add to Collection
      </Button>

      <GearCompareActionButton
        slug={slug}
        name={displayName}
        gearType={gearType}
      />
    </div>
  );

  if (isPending) {
    if (initialIsAuthenticated) {
      return renderPendingAuthenticatedButtons();
    }
    return renderSignedOutButtons(true);
  }

  if (!session) {
    return renderSignedOutButtons(false);
  }

  const ownedActive = isOwned === true;

  return (
    <div className="space-y-3 pt-4">
      {/* Save Item Button */}
      <SaveItemButton slug={slug} initialState={initialSaveState} />

      {/* Wishlist Button */}
      <AddToWishlistButton
        slug={slug}
        initialInWishlist={initialInWishlist}
        size="md"
        variant="outline"
        className="w-full justify-start"
        showLabel
      />

      {/* Ownership Button */}
      <Button
        variant={!ownedActive ? "outline" : "default"}
        className="w-full justify-start"
        onClick={handleOwnershipToggle}
        loading={loading.ownership}
        disabled={isOwned === null}
        icon={ownedActive ? <Package /> : <PackageOpen />}
      >
        {ownedActive ? "Remove from Collection" : "Add to Collection"}
      </Button>

      {/* Compare Button */}
      <GearCompareActionButton
        slug={slug}
        name={displayName}
        gearType={gearType}
      />
    </div>
  );
}
