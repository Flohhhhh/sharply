import "dotenv/config";

import { head, list, put } from "@vercel/blob";
import { getPayload } from "payload";

import config from "../src/payload.config";
import {
  findDuplicateFilenames,
  migratePreparedMedia,
  prepareMediaMigration,
  type LegacyPayloadMedia,
  type PreparedMediaMigration,
} from "../src/server/payload/media-blob-migration";

type MigrationResult = {
  id: number | string;
  filename?: string;
  status: "already-present" | "copied" | "failed" | "skipped";
  error?: string;
};

function isApplyMode(): boolean {
  return process.argv.includes("--apply");
}

async function loadMedia(): Promise<LegacyPayloadMedia[]> {
  const payload = await getPayload({ config });
  const media: LegacyPayloadMedia[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await payload.find({
      collection: "media",
      depth: 0,
      limit: 100,
      page,
      pagination: true,
      overrideAccess: true,
    });

    media.push(...result.docs);
    hasNextPage = result.hasNextPage;
    page += 1;
  }

  return media;
}

async function findExistingBlob(
  filename: string,
  token: string,
): Promise<{ size: number; url: string } | null> {
  let cursor: string | undefined;

  do {
    const result = await list({
      prefix: filename,
      limit: 100,
      cursor,
      token,
    });
    const exactMatch = result.blobs.find((blob) => blob.pathname === filename);
    if (exactMatch) {
      return { size: exactMatch.size, url: exactMatch.url };
    }
    cursor = result.cursor;
  } while (cursor);

  return null;
}

async function migrateOne(
  item: PreparedMediaMigration,
  token: string,
  apply: boolean,
): Promise<MigrationResult> {
  return migratePreparedMedia(item, {
    apply,
    findExisting: (filename) => findExistingBlob(filename, token),
    download: async (sourceUrl) => {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(
          `UploadThing download failed with HTTP ${response.status}`,
        );
      }
      const body = await response.arrayBuffer();
      return { body, size: body.byteLength };
    },
    upload: async (media, body) => {
      const blob = await put(media.filename, body, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: media.mimeType,
        token,
      });
      return blob.url;
    },
    verify: async (url) => head(url, { token }),
  });
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required for this migration");
  }

  const apply = isApplyMode();
  console.log(`[payload-media] Mode: ${apply ? "apply" : "dry-run"}`);

  const docs = await loadMedia();
  const prepared: PreparedMediaMigration[] = [];
  const results: MigrationResult[] = [];

  for (const doc of docs) {
    const preparation = prepareMediaMigration(doc);
    if (preparation.ok) {
      prepared.push(preparation.value);
    } else {
      results.push({
        id: doc.id,
        filename: doc.filename ?? undefined,
        status: "failed",
        error: preparation.error,
      });
    }
  }

  const duplicates = findDuplicateFilenames(prepared);
  if (duplicates.length > 0) {
    throw new Error(
      `duplicate Payload filenames would collide in Blob: ${duplicates.join(", ")}`,
    );
  }

  for (const item of prepared) {
    const result = await migrateOne(item, token, apply);
    results.push(result);
    const suffix = result.error ? `: ${result.error}` : "";
    console.log(
      `[payload-media] ${result.status} ${result.filename ?? result.id}${suffix}`,
    );
  }

  const counts = {
    scanned: docs.length,
    copied: results.filter((item) => item.status === "copied").length,
    alreadyPresent: results.filter((item) => item.status === "already-present")
      .length,
    skipped: results.filter((item) => item.status === "skipped").length,
    failed: results.filter((item) => item.status === "failed").length,
  };
  console.log("[payload-media] Summary", counts);

  if (counts.failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .then(() => {
    process.exit(process.exitCode ?? 0);
  })
  .catch((error) => {
    console.error("[payload-media] Migration failed:", error);
    process.exit(1);
  });
