import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchCurrentUserListPickerStateForGear } from "~/server/user-lists/service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const state = await fetchCurrentUserListPickerStateForGear(slug);
    return NextResponse.json({ state });
  } catch (error) {
    console.error("Error fetching picker state:", error);
    return NextResponse.json(
      { error: "Failed to fetch picker state" },
      { status: 500 },
    );
  }
}
