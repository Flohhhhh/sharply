import "server-only";

import { requireUser, requireRole, type SessionRole } from "~/server/auth";
import {
  performFuzzySearch as performFuzzySearchData,
  checkGearCreationData,
  createGearData,
  fetchAdminGearItemsData,
  type FetchAdminGearItemsParams,
  type FetchAdminGearItemsResult,
  type GearCreationCheckParams,
  type GearCreationCheckResult,
  type GearCreationParams,
  type GearCreationResult,
} from "./data";
import { shouldBlockFuzzyResults } from "~/lib/utils/gear-creation";

export async function performFuzzySearchAdmin(params: {
  inputName: string;
  brandName: string;
  brandId: string;
}) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return performFuzzySearchData(params);
}

export async function checkGearCreationAdmin(
  params: GearCreationCheckParams,
): Promise<GearCreationCheckResult> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return checkGearCreationData(params);
}

export async function createGearAdmin(
  params: GearCreationParams,
): Promise<GearCreationResult> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const { name, brandId, force } = params;

  // Get brand name for fuzzy search
  const { performFuzzySearch } = await import("./data");
  const { results: fuzzy } = await performFuzzySearch({
    inputName: name,
    brandName: "", // Will be filled in createGearData
    brandId,
  });

  // Check if fuzzy results should block creation
  const blockResult = shouldBlockFuzzyResults(fuzzy, force);
  if (blockResult) {
    console.log("[gear:create] fuzzy block", {
      input: name,
      brandId,
      results: fuzzy,
    });
    throw Object.assign(new Error(blockResult.error), {
      status: 409,
      ...blockResult,
    });
  }

  const created = await createGearData(params);

  // Audit: gear created
  const { db } = await import("~/server/db");
  const { auditLogs } = await import("~/server/db/schema");
  await db.insert(auditLogs).values({
    action: "GEAR_CREATE",
    actorUserId: session.user.id,
    gearId: created.id,
  });

  return created;
}

export async function fetchAdminGearItems(
  params: FetchAdminGearItemsParams,
): Promise<FetchAdminGearItemsResult> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return fetchAdminGearItemsData(params);
}
