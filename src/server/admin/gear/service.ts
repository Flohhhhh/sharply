import "server-only";

import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";
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
import { renameGearData } from "./data";
import { db } from "~/server/db";
import { auditLogs, gearEdits } from "~/server/db/schema";
import { updateGearThumbnailData } from "./data";
import { clearImageRequestsForGear, getGearIdBySlug } from "~/server/gear/data";
import { nanoid } from "nanoid";

export async function performFuzzySearchAdmin(params: {
  inputName: string;
  brandName: string;
  brandId: string;
}) {
  const session = await getSessionOrThrow();
  const user = session.user;
  if (!requireRole(user, ["ADMIN", "EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return performFuzzySearchData(params);
}

export async function checkGearCreationAdmin(
  params: GearCreationCheckParams,
): Promise<GearCreationCheckResult> {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN", "EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return checkGearCreationData(params);
}

export async function createGearAdmin(
  params: GearCreationParams,
): Promise<GearCreationResult> {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN", "EDITOR"])) {
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
    actorUserId: session.user?.id ?? "",
    gearId: created.id,
  });

  return created;
}

export async function fetchAdminGearItems(
  params: FetchAdminGearItemsParams,
): Promise<FetchAdminGearItemsResult> {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN", "EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return fetchAdminGearItemsData(params);
}

export async function renameGearService(params: {
  gearId: string;
  newName: string;
}): Promise<{ id: string; name: string; slug: string; searchName: string }> {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN", "EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const updated = await renameGearData({
    gearId: params.gearId,
    newName: params.newName,
  });

  try {
    await db.insert(auditLogs).values({
      action: "GEAR_RENAME",
      actorUserId: session.user?.id ?? "",
      gearId: updated.id,
    });
  } catch {}

  return updated;
}

export async function setGearThumbnailService(params: {
  gearId?: string;
  slug?: string;
  thumbnailUrl: string | null;
}): Promise<{ id: string; slug: string; thumbnailUrl: string | null }> {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN", "EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const { gearId: maybeId, slug, thumbnailUrl } = params;
  let gearId = maybeId;
  if (!gearId) {
    if (!slug)
      throw Object.assign(new Error("Missing gear reference"), { status: 400 });
    const id = await getGearIdBySlug(slug);
    if (!id) throw Object.assign(new Error("Gear not found"), { status: 404 });
    gearId = id;
  }

  // Fetch current gear state to determine if this is an upload, replace, or remove
  const { fetchGearMetadataById } = await import("~/server/gear/data");
  const currentGear = await fetchGearMetadataById(gearId);
  const hadThumbnail = !!currentGear.thumbnailUrl;

  const updated = await updateGearThumbnailData({ gearId, thumbnailUrl });

  if (thumbnailUrl) {
    // Clear outstanding image requests once an image is provided
    await clearImageRequestsForGear(gearId);
  }

  try {
    // Determine the appropriate audit action
    let action:
      | "GEAR_IMAGE_UPLOAD"
      | "GEAR_IMAGE_REPLACE"
      | "GEAR_IMAGE_REMOVE";
    if (thumbnailUrl) {
      // Setting a new thumbnail
      action = hadThumbnail ? "GEAR_IMAGE_REPLACE" : "GEAR_IMAGE_UPLOAD";
    } else {
      // Removing thumbnail
      action = "GEAR_IMAGE_REMOVE";
    }

    await db.insert(auditLogs).values({
      action,
      actorUserId: session.user?.id ?? "",
      gearId: updated.id,
    });

    // Create a contribution record for image uploads (not removals)
    if (thumbnailUrl) {
      await db.insert(gearEdits).values({
        id: nanoid(),
        gearId: updated.id,
        createdById: session.user?.id ?? "",
        status: "APPROVED",
        payload: {
          imageUpload: {
            type: "thumbnail",
            url: thumbnailUrl,
            action: hadThumbnail ? "replace" : "upload",
          },
        },
      });
    }
  } catch {}

  return updated;
}

export async function clearGearThumbnailService(params: {
  gearId?: string;
  slug?: string;
}): Promise<{ id: string; slug: string; thumbnailUrl: string | null }> {
  return setGearThumbnailService({ ...params, thumbnailUrl: null });
}

export async function setGearTopViewService(params: {
  gearId?: string;
  slug?: string;
  topViewUrl: string | null;
}): Promise<{ id: string; slug: string; topViewUrl: string | null }> {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN", "EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const { gearId: maybeId, slug, topViewUrl } = params;
  let gearId = maybeId;
  if (!gearId) {
    if (!slug)
      throw Object.assign(new Error("Missing gear reference"), { status: 400 });
    const id = await getGearIdBySlug(slug);
    if (!id) throw Object.assign(new Error("Gear not found"), { status: 404 });
    gearId = id;
  }

  // Fetch current gear state to determine if this is an upload, replace, or remove
  const { fetchGearMetadataById } = await import("~/server/gear/data");
  const currentGear = await fetchGearMetadataById(gearId);
  const hadTopView = !!currentGear.topViewUrl;

  const { updateGearTopViewData } = await import("./data");
  const updated = await updateGearTopViewData({ gearId, topViewUrl });

  if (topViewUrl) {
    // Clear outstanding image requests once an image is provided
    await clearImageRequestsForGear(gearId);
  }

  try {
    // Determine the appropriate audit action
    let action:
      | "GEAR_TOP_VIEW_UPLOAD"
      | "GEAR_TOP_VIEW_REPLACE"
      | "GEAR_TOP_VIEW_REMOVE";
    if (topViewUrl) {
      // Setting a new top view
      action = hadTopView ? "GEAR_TOP_VIEW_REPLACE" : "GEAR_TOP_VIEW_UPLOAD";
    } else {
      // Removing top view
      action = "GEAR_TOP_VIEW_REMOVE";
    }

    await db.insert(auditLogs).values({
      action,
      actorUserId: session.user?.id ?? "",
      gearId: updated.id,
    });

    // Create a contribution record for image uploads (not removals)
    if (topViewUrl) {
      await db.insert(gearEdits).values({
        id: nanoid(),
        gearId: updated.id,
        createdById: session.user?.id ?? "",
        status: "APPROVED",
        payload: {
          imageUpload: {
            type: "topView",
            url: topViewUrl,
            action: hadTopView ? "replace" : "upload",
          },
        },
      });
    }
  } catch {}

  return updated;
}

export async function clearGearTopViewService(params: {
  gearId?: string;
  slug?: string;
}): Promise<{ id: string; slug: string; topViewUrl: string | null }> {
  return setGearTopViewService({ ...params, topViewUrl: null });
}
