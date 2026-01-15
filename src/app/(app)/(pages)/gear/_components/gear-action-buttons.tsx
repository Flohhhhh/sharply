import {
  fetchOwnershipStatus,
  fetchWishlistStatus,
  type GearAlternativeRow,
} from "~/server/gear/service";
import { GearActionButtonsClient } from "./gear-action-buttons-client";
import type { RawSample } from "~/types/gear";

interface GearActionButtonsProps {
  slug: string;
  gearId?: string;
  gearType: string;
  currentThumbnailUrl?: string | null;
  currentTopViewUrl?: string | null;
  alternatives?: GearAlternativeRow[];
  rawSamples?: RawSample[];
}

export async function GearActionButtons({
  slug,
  gearId,
  gearType,
  currentThumbnailUrl = null,
  currentTopViewUrl = null,
  alternatives = [],
  rawSamples = [],
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
      gearType={gearType}
      initialInWishlist={initialInWishlist}
      initialIsOwned={initialIsOwned}
      currentThumbnailUrl={currentThumbnailUrl}
      currentTopViewUrl={currentTopViewUrl}
      alternatives={alternatives}
      rawSamples={rawSamples}
    />
  );
}
