import { and, asc, eq, isNotNull, lte } from "drizzle-orm";
import { db } from "~/server/db";
import { rawSamples } from "~/server/db/schema";

export type DeletedRawSampleCandidate = {
  id: string;
  fileUrl: string;
  originalFilename: string | null;
  deletedAt: Date | null;
};

export async function fetchDeletedRawSamplesForCleanup(params?: {
  limit?: number;
  deletedBefore?: Date;
}): Promise<DeletedRawSampleCandidate[]> {
  const limit = params?.limit ?? 100;
  const deletedBefore = params?.deletedBefore ?? new Date();

  return db
    .select({
      id: rawSamples.id,
      fileUrl: rawSamples.fileUrl,
      originalFilename: rawSamples.originalFilename,
      deletedAt: rawSamples.deletedAt,
    })
    .from(rawSamples)
    .where(
      and(
        eq(rawSamples.isDeleted, true),
        isNotNull(rawSamples.deletedAt),
        lte(rawSamples.deletedAt, deletedBefore),
      ),
    )
    .orderBy(asc(rawSamples.deletedAt))
    .limit(limit);
}

export async function hardDeleteRawSampleById(sampleId: string): Promise<void> {
  await db.delete(rawSamples).where(eq(rawSamples.id, sampleId));
}
