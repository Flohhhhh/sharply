import {
  fetchOwnershipStatus,
  fetchWishlistStatus,
} from "~/server/gear/service";
import { GearActionButtonsClient } from "./gear-action-buttons-client";
import type { GearAlias } from "~/types/gear";

interface GearActionButtonsProps {
  slug: string;
  name: string;
  regionalAliases?: GearAlias[] | null;
  gearType?: string | null;
}

export async function GearActionButtons({
  slug,
  name,
  regionalAliases,
  gearType,
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
      name={name}
      regionalAliases={regionalAliases}
      gearType={gearType}
      initialInWishlist={initialInWishlist}
      initialIsOwned={initialIsOwned}
    />
  );
}
