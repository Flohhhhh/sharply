import { NextResponse } from "next/server";
import {
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

    const [wishlist, ownership, saveState] = await Promise.all([
      fetchWishlistStatus(slug).catch(() => ({ inWishlist: null })),
      fetchOwnershipStatus(slug).catch(() => ({ isOwned: null })),
      fetchCurrentUserListPickerStateForGear(slug).catch(() => null),
    ]);

    return NextResponse.json({
      inWishlist:
        typeof wishlist.inWishlist === "boolean" ? wishlist.inWishlist : null,
      isOwned: typeof ownership.isOwned === "boolean" ? ownership.isOwned : null,
      saveState,
    });
  } catch (error) {
    console.error("Gear user state error:", error);
    return NextResponse.json(
      { inWishlist: null, isOwned: null, saveState: null },
      { status: 200 },
    );
  }
}
