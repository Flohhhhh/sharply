"use client";

import { useState } from "react";
import { useSession } from "~/lib/auth/auth-client";
import { Button } from "~/components/ui/button";
import { PackageOpen, Package, ImageIcon, Swords } from "lucide-react";
import { toast } from "sonner";
import { withBadgeToasts } from "~/components/badges/badge-toast";
import { AddToCompareButton } from "~/components/compare/add-to-compare-button";
import { AddToWishlistButton } from "~/components/gear/add-to-wishlist-button";
import { GearImageModal } from "~/components/modals/gear-image-modal";
import { requireRole } from "~/lib/auth/auth-helpers";
import {
  actionToggleOwnership,
} from "~/server/gear/actions";
import { AlternativesManager } from "./alternatives-manager";
import type { GearAlternativeRow } from "~/server/gear/service";

interface GearActionButtonsClientProps {
  slug: string;
  gearId?: string;
  initialInWishlist?: boolean | null;
  initialIsOwned?: boolean | null;
  currentThumbnailUrl?: string | null;
  currentTopViewUrl?: string | null;
  alternatives?: GearAlternativeRow[];
}

export function GearActionButtonsClient({
  slug,
  gearId,
  initialInWishlist = null,
  initialIsOwned = null,
  currentThumbnailUrl = null,
  currentTopViewUrl = null,
  alternatives = [],
}: GearActionButtonsClientProps) {
  const { data, isPending, error } = useSession();

  const session = data?.session;
  const user = data?.user;

  const canEditImage = requireRole(user, ["EDITOR"]);
  const canEditAlternatives = requireRole(user, ["EDITOR"]);
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

      {/* compare button */}
      <AddToCompareButton
        slug={slug}
        size="md"
        variant="outline"
        className="w-full"
        showLabel
        iconStyle="scaleOnly"
      />

      {/* Profile Link */}
      {/* <Link href={`/u/${session.user.id}`} className="block">
        <Button
          variant="ghost"
          className="w-full"
          icon={<User className="h-4 w-4" />}
        >
          View My Collection
        </Button>
      </Link> */}

      {canEditImage && (
        <GearImageModal
          slug={slug}
          currentThumbnailUrl={currentThumbnailUrl ?? undefined}
          currentTopViewUrl={currentTopViewUrl ?? undefined}
          trigger={
            <Button
              icon={<ImageIcon className="h-4 w-4" />}
              variant="outline"
              className="w-full"
            >
              Manage Images
            </Button>
          }
        />
      )}

      {canEditAlternatives && gearId && (
        <AlternativesManager
          gearId={gearId}
          gearSlug={slug}
          initialAlternatives={alternatives}
          trigger={
            <Button
              icon={<Swords className="h-4 w-4" />}
              variant="outline"
              className="w-full"
            >
              Manage Alternatives
              {alternatives.length > 0 && (
                <span className="bg-muted ml-2 rounded-full px-1.5 py-0.5 text-xs">
                  {alternatives.length}
                </span>
              )}
            </Button>
          }
        />
      )}
    </div>
  );
}
