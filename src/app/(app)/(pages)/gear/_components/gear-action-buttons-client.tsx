"use client";

import { useState } from "react";
import { useSession } from "~/lib/auth/auth-client";
import { Button } from "~/components/ui/button";
import { Bookmark, Heart, Package, PackageOpen } from "lucide-react";
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

export function GearActionButtonsClient({
  slug,
  name,
  regionalAliases,
  gearType,
  initialInWishlist = null,
  initialIsOwned = null,
  initialSaveState = null,
}: GearActionButtonsClientProps) {
  const { data, isPending } = useSession();
  const displayName = useGearDisplayName({ name, regionalAliases });

  const session = data?.session;
  const callbackUrl = `/gear/${slug}`;
  const signInUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;

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

  // Loading skeleton before auth status resolved (only when session unknown)
  if (isPending && !session) {
    return (
      <div className="space-y-3 pt-4">
        <div className="bg-muted h-10 animate-pulse rounded-md" />
        <div className="bg-muted h-10 animate-pulse rounded-md" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-3 pt-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          icon={<Bookmark />}
          onClick={handleRequireAuthInteraction}
        >
          Save Item
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          icon={<Heart />}
          onClick={handleRequireAuthInteraction}
        >
          Add to Wishlist
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          icon={<PackageOpen />}
          onClick={handleRequireAuthInteraction}
        >
          Add to Collection
        </Button>

        <CompareButton
          slug={slug}
          name={displayName}
          gearType={gearType}
          size="md"
          variant="outline"
          className="w-full justify-start"
          showLabel
        />
      </div>
    );
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
      <CompareButton
        slug={slug}
        name={displayName}
        gearType={gearType}
        size="md"
        variant="outline"
        className="w-full justify-start"
        showLabel
      />
    </div>
  );
}
