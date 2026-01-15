import "server-only";
import { db } from "~/server/db";
import { gearSampleFiles, auditLogs } from "~/server/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export type GearSampleFile = typeof gearSampleFiles.$inferSelect;

// Fetch all samples for a gear item
export async function fetchSamplesByGearIdData(
  gearId: string,
): Promise<GearSampleFile[]> {
  return db
    .select()
    .from(gearSampleFiles)
    .where(eq(gearSampleFiles.gearId, gearId))
    .orderBy(desc(gearSampleFiles.createdAt));
}

// Create sample file record
export async function createSampleFileData(params: {
  gearId: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileSizeBytes: number;
  fileExtension: string;
  uploadedById: string;
}): Promise<GearSampleFile> {
  const [inserted] = await db
    .insert(gearSampleFiles)
    .values(params)
    .returning();
  return inserted!;
}

// Delete sample file record
export async function deleteSampleFileData(id: string): Promise<void> {
  await db.delete(gearSampleFiles).where(eq(gearSampleFiles.id, id));
}

// Get sample file by ID
export async function getSampleFileByIdData(
  id: string,
): Promise<GearSampleFile | null> {
  const [file] = await db
    .select()
    .from(gearSampleFiles)
    .where(eq(gearSampleFiles.id, id))
    .limit(1);
  return file ?? null;
}

// Increment download count
export async function incrementDownloadCountData(id: string): Promise<void> {
  await db
    .update(gearSampleFiles)
    .set({ downloadCount: sql`${gearSampleFiles.downloadCount} + 1` })
    .where(eq(gearSampleFiles.id, id));
}

// Insert audit log
export async function insertSampleAuditLogData(params: {
  action: "GEAR_SAMPLE_UPLOAD" | "GEAR_SAMPLE_DELETE" | "GEAR_SAMPLE_DOWNLOAD";
  actorUserId: string;
  gearId: string;
}): Promise<void> {
  await db.insert(auditLogs).values({
    action: params.action,
    actorUserId: params.actorUserId,
    gearId: params.gearId,
  });
}
