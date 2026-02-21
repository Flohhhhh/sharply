import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "~/auth";
import { fetchUserListsForProfile } from "~/server/user-lists/service";

const querySchema = z.object({
  profileUserId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      profileUserId: searchParams.get("profileUserId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid profile user id" },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const result = await fetchUserListsForProfile({
      profileUserId: parsed.data.profileUserId,
      viewerUserId: session?.user?.id,
    });

    return NextResponse.json({
      lists: result.lists,
      myProfile: result.isOwner,
    });
  } catch (error) {
    console.error("Error fetching user lists:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
