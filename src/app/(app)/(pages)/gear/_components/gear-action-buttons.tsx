import {
  fetchOwnershipStatus,
  fetchWishlistStatus,
  type GearAlternativeRow,
} from "~/server/gear/service";
import { GearActionButtonsClient } from "./gear-action-buttons-client";

interface GearActionButtonsProps {
  slug: string;
  gearId?: string;
  currentThumbnailUrl?: string | null;
  currentTopViewUrl?: string | null;
  alternatives?: GearAlternativeRow[];
}

export async function GearActionButtons({
  slug,
  gearId,
  currentThumbnailUrl = null,
  currentTopViewUrl = null,
  alternatives = [],
}: GearActionButtonsProps) {
  let initialInWishlist: boolean | null = null;
  let initialIsOwned: boolean | null = null;

  try {
    const [wl, own] = await Promise.all([
      fetchWishlistStatus(slug).catch(() => null),
      fetchOwnershipStatus(slug).catch(() => null),
    ]);
    initialInWishlist = wl ? Boolean(wl.inWishlist) : null;
    initialIsOwned = own ? Boolean(own.isOwned) : null;
  } catch {
    initialInWishlist = null;
    initialIsOwned = null;
  }

  return (
    <GearActionButtonsClient
      slug={slug}
      gearId={gearId}
      initialInWishlist={initialInWishlist}
      initialIsOwned={initialIsOwned}
      currentThumbnailUrl={currentThumbnailUrl}
      currentTopViewUrl={currentTopViewUrl}
      alternatives={alternatives}
    />
  );
}
