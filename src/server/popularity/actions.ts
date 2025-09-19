"use server";
import "server-only";

import {
  recordGearView,
  recordCompareAdd,
  incrementComparePairCount,
} from "./service";
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

/**
 * actionRecordCompareAdd
 *
 * Client calls this when a gear is added to compare (or replaced in).
 * Accepts slug and optional visitorId for anonymous dedupe.
 */
export async function actionRecordCompareAdd(params: {
  slug: string;
  visitorId?: string | null;
}) {
  const cookieStore = await cookies();
  let visitorId =
    params.visitorId ?? cookieStore.get("visitorId")?.value ?? null;
  if (!visitorId) {
    visitorId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    cookieStore.set("visitorId", visitorId, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 3,
    });
  }
  return recordCompareAdd({ slug: params.slug, visitorId });
}

/**
 * actionIncrementComparePairCount
 *
 * Increments a per-pair counter with a short-lived cookie-based dedupe (30 minutes).
 * We set a cookie `comparePair:<pairKey>` so subsequent page loads within 30 minutes
 * do not increment again.
 */
export async function actionIncrementComparePairCount(params: {
  slugs: [string, string];
}) {
  const sorted = params.slugs.slice().sort((a, b) => a.localeCompare(b));
  const pairKey = `${sorted[0]}|${sorted[1]}`;

  const cookieStore = await cookies();
  const cookieName = `comparePair:${pairKey}`;
  const existing = cookieStore.get(cookieName)?.value;
  if (existing === "1") {
    return { success: true, deduped: true as const } as const;
  }

  const res = await incrementComparePairCount({
    slugs: [sorted[0]!, sorted[1]!],
  });

  // Optimistic dedupe cookie: 30 minutes
  cookieStore.set(cookieName, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });

  return { ...res, deduped: false as const } as const;
}
