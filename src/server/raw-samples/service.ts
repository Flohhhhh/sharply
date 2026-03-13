import { UTApi } from "uploadthing/server";
import {
  fetchDeletedRawSamplesForCleanup,
  hardDeleteRawSampleById,
  type DeletedRawSampleCandidate,
} from "./data";
import { extractUploadThingFileKey } from "./uploadthing";

const DEFAULT_BATCH_LIMIT = 100;
const MAX_BATCH_LIMIT = 500;

type CleanupDeletedRawSampleStatus =
  | "dry_run"
  | "deleted"
  | "invalid_url"
  | "delete_failed";

export type CleanupDeletedRawSamplesItemResult = Pick<
  DeletedRawSampleCandidate,
  "id" | "fileUrl" | "originalFilename" | "deletedAt"
> & {
  fileKey: string | null;
  status: CleanupDeletedRawSampleStatus;
  error?: string;
};

export type CleanupDeletedRawSamplesResult = {
  dryRun: boolean;
  limit: number;
  deletedBefore: Date;
  scanned: number;
  eligible: number;
  deleted: number;
  skipped: number;
  failed: number;
  items: CleanupDeletedRawSamplesItemResult[];
};

function clampLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_BATCH_LIMIT;
  return Math.min(Math.max(Math.trunc(limit ?? DEFAULT_BATCH_LIMIT), 1), MAX_BATCH_LIMIT);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function cleanupDeletedRawSamples(params?: {
  dryRun?: boolean;
  limit?: number;
  deletedBefore?: Date;
}): Promise<CleanupDeletedRawSamplesResult> {
  const dryRun = params?.dryRun ?? false;
  const limit = clampLimit(params?.limit);
  const deletedBefore = params?.deletedBefore ?? new Date();
  const items = await fetchDeletedRawSamplesForCleanup({ limit, deletedBefore });

  if (!dryRun && !process.env.UPLOADTHING_TOKEN) {
    throw new Error("UPLOADTHING_TOKEN is required to clean up raw samples");
  }

  const utapi = dryRun ? null : new UTApi({ token: process.env.UPLOADTHING_TOKEN });

  const results: CleanupDeletedRawSamplesItemResult[] = [];
  let eligible = 0;
  let deleted = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    const fileKey = extractUploadThingFileKey(item.fileUrl);

    if (!fileKey) {
      skipped++;
      results.push({
        ...item,
        fileKey: null,
        status: "invalid_url",
        error: "Could not extract UploadThing file key from URL",
      });
      continue;
    }

    eligible++;

    if (dryRun) {
      results.push({
        ...item,
        fileKey,
        status: "dry_run",
      });
      continue;
    }

    try {
      const deleteResult = await utapi!.deleteFiles(fileKey);

      if (!deleteResult.success || deleteResult.deletedCount < 1) {
        failed++;
        results.push({
          ...item,
          fileKey,
          status: "delete_failed",
          error: "UploadThing did not confirm deletion",
        });
        continue;
      }

      await hardDeleteRawSampleById(item.id);

      deleted++;
      results.push({
        ...item,
        fileKey,
        status: "deleted",
      });
    } catch (error) {
      failed++;
      console.error("[raw-samples-cleanup] failed", {
        sampleId: item.id,
        fileKey,
        error,
      });
      results.push({
        ...item,
        fileKey,
        status: "delete_failed",
        error: getErrorMessage(error),
      });
    }
  }

  return {
    dryRun,
    limit,
    deletedBefore,
    scanned: items.length,
    eligible,
    deleted,
    skipped,
    failed,
    items: results,
  };
}
