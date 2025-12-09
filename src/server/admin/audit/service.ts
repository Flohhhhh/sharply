import "server-only";

import { requireUser, requireRole, type UserRole } from "~/server/auth";
import {
  fetchAuditLogsData,
  type FetchAuditLogsParams,
  type AuditLogRow,
} from "./data";

export async function fetchAuditLogs(
  params: FetchAuditLogsParams,
): Promise<{ items: AuditLogRow[] }> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as UserRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const limit = Math.min(params.limit ?? 50, 200);
  const items = await fetchAuditLogsData({ ...params, limit });
  return { items };
}
