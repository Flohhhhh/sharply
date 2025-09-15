"use server";
import "server-only";

import { recordGearView } from "./service";
import { cookies, headers } from "next/headers";

/**
 * actionRecordGearView
 *
 * Client can call this to record a view. Pass slug and an optional visitorId
 * (generated and stored by the client). Authenticated users can omit visitorId.
 */
export async function actionRecordGearView(params: {
  slug: string;
  visitorId?: string | null;
  userAgent?: string | null;
}) {
  // Resolve or create a visitorId cookie for anonymous dedupe. Authenticated
  // users will be deduped by userId in the service layer.
  const cookieStore = await cookies();
  let visitorId =
    params.visitorId ?? cookieStore.get("visitorId")?.value ?? null;
  if (!visitorId) {
    // Generate a short random id; we avoid crypto UUID to keep it lightweight.
    visitorId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    cookieStore.set("visitorId", visitorId, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 3, // 3 days to match dedupe horizon
    });
  }

  const hdrs = await headers();
  const ua = params.userAgent ?? hdrs.get("user-agent") ?? null;

  const res = await recordGearView({
    slug: params.slug,
    userId: null, // will be derived from session in service
    visitorId,
    userAgent: ua,
  });
  return res;
}
