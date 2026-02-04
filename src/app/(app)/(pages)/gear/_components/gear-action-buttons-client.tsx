"use client";

import { useState } from "react";
import { useSession } from "~/lib/auth/auth-client";
import { Button } from "~/components/ui/button";
import { Package, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { withBadgeToasts } from "~/components/badges/badge-toast";
import { CompareButton } from "~/components/compare/compare-button";
import { AddToWishlistButton } from "~/components/gear/add-to-wishlist-button";
import { actionToggleOwnership } from "~/server/gear/actions";

interface GearActionButtonsClientProps {
  slug: string;
  name: string;
  gearType?: string | null;
  initialInWishlist?: boolean | null;
  initialIsOwned?: boolean | null;
}

export function GearActionButtonsClient({
  slug,
  name,
  gearType,
  initialInWishlist = null,
  initialIsOwned = null,
}: GearActionButtonsClientProps) {
  const { data, isPending } = useSession();

  const session = data?.session;
  const user = data?.user;

  const [isOwned, setIsOwned] = useState<boolean | null>(initialIsOwned);
  const [loading, setLoading] = useState({
    ownership: false,
  });

  // Initial state comes from the server wrapper props; no client fetch

  const handleOwnershipToggle = async () => {
    if (!session || isOwned === null) return;

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
    } catch (error) {
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
      <div className="pt-4">
        <Button variant="outline" className="w-full" disabled>
          Sign in to interact with gear
        </Button>
      </div>
    );
  }

  const ownedActive = isOwned === true;

  return (
    <div className="space-y-3 pt-4">
      {/* Wishlist Button */}
      <AddToWishlistButton
        slug={slug}
        initialInWishlist={initialInWishlist}
        size="md"
        variant="outline"
        fullWidth
        showLabel
      />

      {/* Ownership Button */}
      <Button
        variant={!ownedActive ? "outline" : "default"}
        className="w-full"
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
        name={name}
        gearType={gearType}
        size="md"
        variant="outline"
        className="w-full"
        showLabel
      />
    </div>
  );
}
