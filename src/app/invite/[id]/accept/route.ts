import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const inviteId = params.id;
  const res = NextResponse.redirect(
    new URL("/api/auth/signin?callbackUrl=%2Fauth%2Fwelcome", _req.url),
  );
  res.cookies.set("invite_id", inviteId, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 30,
  });
  return res;
}
