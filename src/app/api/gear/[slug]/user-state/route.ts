import { NextResponse } from "next/server";
import {
  fetchImageRequestStatus,
  fetchOwnershipStatus,
  fetchWishlistStatus,
} from "~/server/gear/service";
import { fetchCurrentUserListPickerStateForGear } from "~/server/user-lists/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const [wishlist, ownership, saveState, imageRequest] = await Promise.all([
      fetchWishlistStatus(slug).catch(() => ({ inWishlist: null })),
      fetchOwnershipStatus(slug).catch(() => ({ isOwned: null })),
      fetchCurrentUserListPickerStateForGear(slug).catch(() => null),
      fetchImageRequestStatus(slug).catch(() => ({ hasRequested: null })),
    ]);

    return NextResponse.json({
      inWishlist:
        typeof wishlist.inWishlist === "boolean" ? wishlist.inWishlist : null,
      isOwned: typeof ownership.isOwned === "boolean" ? ownership.isOwned : null,
      saveState,
      hasImageRequest:
        typeof imageRequest.hasRequested === "boolean"
          ? imageRequest.hasRequested
          : null,
    });
  } catch (error) {
    console.error("Gear user state error:", error);
    return NextResponse.json(
      {
        inWishlist: null,
        isOwned: null,
        saveState: null,
        hasImageRequest: null,
      },
      { status: 200 },
    );
  }
}
