import "server-only";
import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";
import {
  fetchSamplesByGearIdData,
  createSampleFileData,
  deleteSampleFileData,
  getSampleFileByIdData,
  incrementDownloadCountData,
  insertSampleAuditLogData,
  type GearSampleFile,
} from "./data";

// Fetch samples - public read
export async function fetchSamplesByGearId(
  gearId: string,
): Promise<GearSampleFile[]> {
  return fetchSamplesByGearIdData(gearId);
}

// Create sample - EDITOR+ only
export async function createSampleFile(params: {
  gearId: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileSizeBytes: number;
  fileExtension: string;
}): Promise<GearSampleFile> {
  const { user } = await getSessionOrThrow();

  if (!requireRole(user, ["EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const sample = await createSampleFileData({
    ...params,
    uploadedById: user.id,
  });

  // Audit log
  await insertSampleAuditLogData({
    action: "GEAR_SAMPLE_UPLOAD",
    actorUserId: user.id,
    gearId: params.gearId,
  });

  return sample;
}

// Delete sample - EDITOR+ only
export async function deleteSampleFile(id: string): Promise<void> {
  const { user } = await getSessionOrThrow();

  if (!requireRole(user, ["EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const file = await getSampleFileByIdData(id);
  if (!file) {
    throw Object.assign(new Error("File not found"), { status: 404 });
  }

  await deleteSampleFileData(id);

  // Audit log
  await insertSampleAuditLogData({
    action: "GEAR_SAMPLE_DELETE",
    actorUserId: user.id,
    gearId: file.gearId,
  });
}

// Get sample file by ID
export async function getSampleFileById(
  id: string,
): Promise<GearSampleFile | null> {
  return getSampleFileByIdData(id);
}

// Track download
export async function trackSampleDownload(
  id: string,
  userId?: string,
): Promise<void> {
  await incrementDownloadCountData(id);

  if (userId) {
    const file = await getSampleFileByIdData(id);
    if (file) {
      await insertSampleAuditLogData({
        action: "GEAR_SAMPLE_DOWNLOAD",
        actorUserId: userId,
        gearId: file.gearId,
      });
    }
  }
}
