"use server";
import "server-only";

import { recordGearView } from "./service";

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
  // We intentionally do not derive userId on the client. Record will dedupe
  // using userId from the session on the server when the caller is authenticated.
  const res = await recordGearView({
    slug: params.slug,
    userId: null, // resolved inside service when wired with session-aware entry points if needed
    visitorId: params.visitorId ?? null,
    userAgent: params.userAgent ?? null,
  });
  return res;
}
