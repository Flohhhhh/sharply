import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "~/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: inviteId } = await params;
  const nextFromQuery = req.nextUrl.searchParams.get("next");
  const next = nextFromQuery?.startsWith("/") ? nextFromQuery : "/";

  const welcomeUrl = `/auth/welcome?inviteId=${encodeURIComponent(inviteId)}&next=${encodeURIComponent(next)}`;
  const signInUrl = `/auth/signin?callbackUrl=${encodeURIComponent(welcomeUrl)}`;

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  const redirectTarget = session ? welcomeUrl : signInUrl;

  const res = NextResponse.redirect(new URL(redirectTarget, req.url));
  res.cookies.set("invite_id", inviteId, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 30,
  });
  return res;
}
