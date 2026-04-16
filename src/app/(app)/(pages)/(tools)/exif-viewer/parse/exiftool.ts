import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { exiftool, type RawTags } from "exiftool-vendored";
import { type ExifViewerTagEntry } from "../types";

const EXIFTOOL_READ_ARGS = ["-G1", "-a", "-s", "-u", "-sort"];
const RELEVANT_GROUPS = new Set([
  "exif",
  "ifd0",
  "composite",
  "makernotes",
  "sony",
  "nikon",
  "canon",
  "fujifilm",
  "fujiifd",
  "file",
]);

function compactValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 200 ? `${value.slice(0, 200)}...` : value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 8).map(compactValue);
  }

  return value;
}

function parseTagEntry(key: string, value: unknown): ExifViewerTagEntry {
  const separatorIndex = key.indexOf(":");
  if (separatorIndex === -1) {
    return {
      key,
      group: "Unknown",
      tag: key,
      value: compactValue(value),
    };
  }

  return {
    key,
    group: key.slice(0, separatorIndex),
    tag: key.slice(separatorIndex + 1),
    value: compactValue(value),
  };
}

function isRelevantTag(entry: ExifViewerTagEntry) {
  const lowerGroup = entry.group.toLowerCase();
  const lowerTag = entry.tag.toLowerCase();

  if (RELEVANT_GROUPS.has(lowerGroup)) return true;
  if (lowerTag === "make" || lowerTag === "model") return true;

  return (
    lowerTag.includes("shutter") ||
    lowerTag.includes("count") ||
    lowerTag.includes("image") ||
    lowerTag.includes("exposure")
  );
}

export function normalizeExifToolTagEntries(rawTags: RawTags): ExifViewerTagEntry[] {
  return Object.entries(rawTags)
    .filter(([key]) => key !== "errors" && key !== "warnings")
    .map(([key, value]) => parseTagEntry(key, value))
    .filter(isRelevantTag);
}

export async function readExifToolTags(params: {
  fileName: string;
  buffer: Uint8Array;
}) {
  const extension = path.extname(params.fileName).toLowerCase();
  const tempFilePath = path.join(
    tmpdir(),
    `exif-viewer-${randomUUID()}${extension}`,
  );

  await writeFile(tempFilePath, Buffer.from(params.buffer));

  try {
    const rawTags = await exiftool.readRaw<RawTags>(tempFilePath, {
      readArgs: EXIFTOOL_READ_ARGS,
    });

    return {
      rawTags,
      warnings:
        Array.isArray(rawTags.warnings) && rawTags.warnings.length > 0
          ? rawTags.warnings.map(String)
          : [],
      relevantTags: normalizeExifToolTagEntries(rawTags),
    };
  } finally {
    await unlink(tempFilePath).catch(() => undefined);
  }
}
