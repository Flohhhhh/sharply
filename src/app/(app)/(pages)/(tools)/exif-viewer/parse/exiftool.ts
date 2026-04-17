import {
  type ExifViewerMetadataRow,
  type ExifViewerTagEntry,
} from "../types";

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

type ExifToolTagMap = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectWarningValues(
  key: string,
  value: unknown,
  warnings: string[],
) {
  const lowerKey = key.toLowerCase();
  const isWarningLike =
    lowerKey === "warnings" ||
    lowerKey === "warning" ||
    lowerKey === "error" ||
    lowerKey === "errors" ||
    lowerKey.endsWith(":warning") ||
    lowerKey.endsWith(":error");

  if (!isWarningLike) {
    return false;
  }

  const pushWarning = (warningValue: unknown) => {
    if (warningValue === null || warningValue === undefined) {
      return;
    }

    if (
      typeof warningValue === "string" ||
      typeof warningValue === "number" ||
      typeof warningValue === "boolean" ||
      typeof warningValue === "bigint"
    ) {
      warnings.push(String(warningValue));
      return;
    }

    const serialized = JSON.stringify(warningValue);
    if (serialized) {
      warnings.push(serialized);
    }
  };

  if (Array.isArray(value)) {
    for (const warning of value) {
      pushWarning(warning);
    }

    return true;
  }

  pushWarning(value);

  return true;
}

export function compactValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 200 ? `${value.slice(0, 200)}...` : value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 8).map(compactValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 8)
        .map(([key, nestedValue]) => [key, compactValue(nestedValue)]),
    );
  }

  return value;
}

export function parseTagEntry(key: string, value: unknown): ExifViewerTagEntry {
  const compactedValue = compactValue(value);
  const separatorIndex = key.indexOf(":");

  if (separatorIndex === -1) {
    return {
      key,
      group: "Unknown",
      tag: key,
      value: compactedValue,
    };
  }

  return {
    key,
    group: key.slice(0, separatorIndex),
    tag: key.slice(separatorIndex + 1),
    value: compactedValue,
  };
}

export function sanitizeExifViewerTagEntries(
  tagEntries: ExifViewerTagEntry[],
): ExifViewerTagEntry[] {
  return tagEntries.map((entry) => parseTagEntry(entry.key, entry.value));
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

export function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.length > 1_000 ? `${value.slice(0, 1_000)}...` : value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 12)
      .map((item) => formatMetadataValue(item))
      .join(", ");
  }

  if (typeof value === "object") {
    const serialized = JSON.stringify(value);
    if (!serialized) {
      return "";
    }

    return serialized.length > 1_000
      ? `${serialized.slice(0, 1_000)}...`
      : serialized;
  }

  return "";
}

export function extractExifToolJsonTagMap(rawOutput: unknown): {
  rawTags: ExifToolTagMap;
  warnings: string[];
} {
  const warnings: string[] = [];
  const rawRecord = Array.isArray(rawOutput)
    ? rawOutput.find(isRecord) ?? {}
    : isRecord(rawOutput)
      ? rawOutput
      : {};

  const rawTags = Object.fromEntries(
    Object.entries(rawRecord).filter(([key, value]) => {
      return !collectWarningValues(key, value, warnings);
    }),
  );

  return {
    rawTags,
    warnings,
  };
}

export function normalizeExifToolTagEntries(
  rawTags: ExifToolTagMap,
): ExifViewerTagEntry[] {
  return Object.entries(rawTags).map(([key, value]) => parseTagEntry(key, value));
}

export function filterRelevantExifToolTags(tagEntries: ExifViewerTagEntry[]) {
  return tagEntries.filter(isRelevantTag);
}

export function toExifViewerMetadataRows(
  tagEntries: ExifViewerTagEntry[],
): ExifViewerMetadataRow[] {
  return tagEntries.map((entry) => ({
    key: entry.key,
    group: entry.group,
    tag: entry.tag,
    value: formatMetadataValue(entry.value),
  }));
}
