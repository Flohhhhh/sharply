import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: inviteId } = await params;
  const res = NextResponse.redirect(
    // Send users to welcome first-time, then allow welcome to redirect to `next` (default "/")
    new URL(
      "/api/auth/signin?callbackUrl=%2Fauth%2Fwelcome%3Fnext%3D%2F",
      _req.url,
    ),
  );
  res.cookies.set("invite_id", inviteId, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 30,
  });
  return res;
}
