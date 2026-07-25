export type LegacyPayloadMedia = {
  id: number | string;
  _key?: string | null;
  filename?: string | null;
  filesize?: number | null;
  mimeType?: string | null;
};

export type PreparedMediaMigration = {
  id: number | string;
  filename: string;
  expectedSize: number | null;
  mimeType: string | undefined;
  sourceUrl: string;
};

export type MediaMigrationPreparation =
  | { ok: true; value: PreparedMediaMigration }
  | { ok: false; error: string };

export type MediaMigrationResult = {
  id: number | string;
  filename: string;
  status: "already-present" | "copied" | "failed" | "skipped";
  error?: string;
};

type MigrationDependencies = {
  apply: boolean;
  findExisting: (
    filename: string,
  ) => Promise<{ size: number; url: string } | null>;
  download: (sourceUrl: string) => Promise<{ body: ArrayBuffer; size: number }>;
  upload: (item: PreparedMediaMigration, body: ArrayBuffer) => Promise<string>;
  verify: (url: string) => Promise<{ size: number }>;
};

export function prepareMediaMigration(
  media: LegacyPayloadMedia,
): MediaMigrationPreparation {
  if (!media.filename) {
    return { ok: false, error: "missing Payload filename" };
  }

  if (!media._key) {
    return { ok: false, error: "missing legacy UploadThing key" };
  }

  return {
    ok: true,
    value: {
      id: media.id,
      filename: media.filename,
      expectedSize: typeof media.filesize === "number" ? media.filesize : null,
      mimeType: media.mimeType || undefined,
      sourceUrl: `https://utfs.io/f/${encodeURIComponent(media._key)}`,
    },
  };
}

export function hasMatchingSize(
  actualSize: number,
  expectedSize: number | null,
): boolean {
  return expectedSize === null || actualSize === expectedSize;
}

export function findDuplicateFilenames(
  media: PreparedMediaMigration[],
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of media) {
    if (seen.has(item.filename)) {
      duplicates.add(item.filename);
    }
    seen.add(item.filename);
  }

  return [...duplicates].sort();
}

export async function migratePreparedMedia(
  item: PreparedMediaMigration,
  dependencies: MigrationDependencies,
): Promise<MediaMigrationResult> {
  try {
    const existing = await dependencies.findExisting(item.filename);
    if (existing && hasMatchingSize(existing.size, item.expectedSize)) {
      return {
        id: item.id,
        filename: item.filename,
        status: "already-present",
      };
    }

    if (!dependencies.apply) {
      return { id: item.id, filename: item.filename, status: "skipped" };
    }

    const source = await dependencies.download(item.sourceUrl);
    if (!hasMatchingSize(source.size, item.expectedSize)) {
      throw new Error(
        `source size mismatch: expected ${item.expectedSize}, received ${source.size}`,
      );
    }

    const url = await dependencies.upload(item, source.body);
    const verified = await dependencies.verify(url);
    if (!hasMatchingSize(verified.size, source.size)) {
      throw new Error(
        `destination size mismatch: expected ${source.size}, received ${verified.size}`,
      );
    }

    return { id: item.id, filename: item.filename, status: "copied" };
  } catch (error) {
    return {
      id: item.id,
      filename: item.filename,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
