import "server-only";

import { headers } from "next/headers";
import { auth } from "~/auth";

/**
 * Fetches the current session or throws 401 if missing.
 * Server-only helper to avoid repeating boilerplate.
 */
export async function getSessionOrThrow() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  return session;
}
