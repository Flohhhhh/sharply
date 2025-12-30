import {
  fetchOwnershipStatus,
  fetchWishlistStatus,
} from "~/server/gear/service";
import { GearActionButtonsClient } from "./gear-action-buttons-client";

interface GearActionButtonsProps {
  slug: string;
  currentThumbnailUrl?: string | null;
}

export async function GearActionButtons({
  slug,
  currentThumbnailUrl = null,
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
      initialInWishlist={initialInWishlist}
      initialIsOwned={initialIsOwned}
      currentThumbnailUrl={currentThumbnailUrl}
    />
  );
}
