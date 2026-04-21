import "server-only";

import { headers } from "next/headers";
import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import {
  fetchAuditLogsData,
  type AuditLogRow,
  type FetchAuditLogsParams,
} from "./data";

export async function fetchAuditLogs(
  params: FetchAuditLogsParams,
): Promise<{ items: AuditLogRow[] }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const user = session?.user;
  if (!requireRole(user, ["ADMIN"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const limit = Math.min(params.limit ?? 50, 200);
  const items = await fetchAuditLogsData({ ...params, limit });
  return { items };
}
