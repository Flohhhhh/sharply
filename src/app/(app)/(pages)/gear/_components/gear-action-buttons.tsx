import {
  fetchOwnershipStatus,
  fetchWishlistStatus,
} from "~/server/gear/service";
import { fetchCurrentUserListPickerStateForGear } from "~/server/user-lists/service";
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
  let initialSaveState:
    | {
        lists: Array<{
          id: string;
          name: string;
          isDefault: boolean;
          itemCount: number;
        }>;
        savedListIds: string[];
        defaultListId: string | null;
      }
    | null = null;

  try {
    const [wl, own, saveState] = await Promise.all([
      fetchWishlistStatus(slug).catch(() => null),
      fetchOwnershipStatus(slug).catch(() => null),
      fetchCurrentUserListPickerStateForGear(slug).catch(() => null),
    ]);
    initialInWishlist = wl ? Boolean(wl.inWishlist) : null;
    initialIsOwned = own ? Boolean(own.isOwned) : null;
    initialSaveState = saveState;
  } catch {
    initialInWishlist = null;
    initialIsOwned = null;
    initialSaveState = null;
  }

  return (
    <GearActionButtonsClient
      slug={slug}
      name={name}
      regionalAliases={regionalAliases}
      gearType={gearType}
      initialInWishlist={initialInWishlist}
      initialIsOwned={initialIsOwned}
      initialSaveState={initialSaveState}
    />
  );
}
