import "server-only";

import { createHash, createHmac } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import {
  EXIF_VIEWER_CAPTURE_DATE_CANDIDATE_KEYS,
  EXIF_VIEWER_SERIAL_CANDIDATE_KEYS,
} from "~/app/(app)/(pages)/(tools)/exif-viewer/types";
import type {
  ExifTrackingDeleteResponse,
  ExifTrackingHistoryResponse,
  ExifTrackingPrimaryCountType,
  ExifViewerMatchedGear,
  ExifViewerMetadataRow,
  ExifViewerResponse,
  ExifViewerTrackingState,
  NormalizedCameraBrand,
} from "~/app/(app)/(pages)/(tools)/exif-viewer/types";

const EXIF_TRACKING_TOKEN_AUDIENCE = "sharply:exif-tracking";
const EXIF_TRACKING_TOKEN_VERSION = 1;
const EXIF_TRACKING_TOKEN_TTL_SECONDS = 15 * 60;

type ExtractorShape = ExifViewerResponse["extractor"];
type CameraShape = ExifViewerResponse["camera"];
type MatchedGear = ExifViewerMatchedGear | null;

type ExifTrackingTokenPayload = {
  version: number;
  serialHash: string;
  normalizedBrand: NormalizedCameraBrand;
  makeRaw: string | null;
  modelRaw: string | null;
  matchedGearId: string | null;
  captureAt: string | null;
  primaryCountType: ExifTrackingPrimaryCountType;
  primaryCountValue: number;
  shutterCount: number | null;
  totalShutterCount: number | null;
  mechanicalShutterCount: number | null;
  sourceTag: string | null;
  mechanicalSourceTag: string | null;
};

type VerifiedExifTrackingTokenPayload = ExifTrackingTokenPayload & {
  iat: number;
  exp: number;
};

function getTokenSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for EXIF tracking tokens.");
  }

  return new TextEncoder().encode(`sharply:exif-tracking:${secret}`);
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function findMetadataValue(
  rows: ExifViewerMetadataRow[],
  candidateKeys: readonly string[],
) {
  const matches = new Set(candidateKeys.map((key) => key.toLowerCase()));
  const match = rows.find((row) => matches.has(row.key.toLowerCase()));
  const value = match?.value.trim();
  return value ? value : null;
}

export function normalizeExifMake(value: string | null | undefined) {
  if (!value) return null;

  const normalized = normalizeWhitespace(value)
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(
      /\b(corporation|corp\.?|company|co\.?|inc\.?|ltd\.?|limited)\b/g,
      " ",
    )
    .replace(/[.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || null;
}

export function normalizeExifModel(value: string | null | undefined) {
  if (!value) return null;

  const normalized = normalizeWhitespace(value)
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  return normalized || null;
}

export function normalizeExifSerial(value: string | null | undefined) {
  if (!value) return null;

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  return normalized || null;
}

export function hashExifSerial(serial: string) {
  return createHmac("sha256", getTokenSecret()).update(serial).digest("hex");
}

export function normalizeExifCaptureAt(value: string | null | undefined) {
  if (!value) return null;

  const normalized = value.replace(
    /^(\d{4}):(\d{2}):(\d{2})\s/,
    "$1-$2-$3T",
  );
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export function extractExifSerialNumber(rows: ExifViewerMetadataRow[]) {
  return findMetadataValue(rows, EXIF_VIEWER_SERIAL_CANDIDATE_KEYS);
}

export function extractExifCaptureAt(rows: ExifViewerMetadataRow[]) {
  return normalizeExifCaptureAt(
    findMetadataValue(rows, EXIF_VIEWER_CAPTURE_DATE_CANDIDATE_KEYS),
  );
}

export function selectPrimaryExifCount(extractor: ExtractorShape) {
  if (extractor.totalShutterCount !== null) {
    return {
      type: "total" as const,
      value: extractor.totalShutterCount,
    };
  }

  if (extractor.mechanicalShutterCount !== null) {
    return {
      type: "mechanical" as const,
      value: extractor.mechanicalShutterCount,
    };
  }

  if (extractor.shutterCount !== null) {
    return {
      type: "generic" as const,
      value: extractor.shutterCount,
    };
  }

  return null;
}

export function buildExifReadingDedupeKey(params: {
  trackedCameraId: string;
  primaryCountType: ExifTrackingPrimaryCountType;
  primaryCountValue: number;
  captureAt: string | null;
}) {
  return createHash("sha256")
    .update(
      [
        params.trackedCameraId,
        params.primaryCountType,
        String(params.primaryCountValue),
        params.captureAt ?? "none",
      ].join("|"),
    )
    .digest("hex");
}

function createDefaultTrackingState(
  reason: ExifViewerTrackingState["reason"] = "unsupported_result",
): ExifViewerTrackingState {
  return {
    eligible: false,
    reason,
    saveToken: null,
    matchedGear: null,
    trackedCamera: null,
    currentReadingSaved: false,
  };
}

async function resolveMatchedGear(params: {
  camera: CameraShape;
}): Promise<MatchedGear> {
  const modelNormalized = normalizeExifModel(params.camera.model);
  const makeNormalized = normalizeExifMake(params.camera.make);
  const normalizedBrand =
    params.camera.normalizedBrand === "unknown"
      ? null
      : params.camera.normalizedBrand;

  if (!modelNormalized) {
    return null;
  }

  const data = await import("./data");

  if (makeNormalized) {
    const exactMatches = await data.findGearExifAliasMatches({
      makeNormalized,
      modelNormalized,
      normalizedBrand,
    });

    if (exactMatches.length === 1) {
      return exactMatches[0]!;
    }

    if (exactMatches.length > 1) {
      return null;
    }
  }

  const modelMatches = await data.findGearExifAliasMatchesByModel({
    modelNormalized,
    normalizedBrand,
  });

  return modelMatches.length === 1 ? modelMatches[0]! : null;
}

export async function createSignedExifTrackingToken(
  payload: ExifTrackingTokenPayload,
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(EXIF_TRACKING_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${EXIF_TRACKING_TOKEN_TTL_SECONDS}s`)
    .sign(getTokenSecret());
}

export async function verifySignedExifTrackingToken(token: string) {
  const verified = await jwtVerify(token, getTokenSecret(), {
    audience: EXIF_TRACKING_TOKEN_AUDIENCE,
  });

  const payload = verified.payload as Partial<VerifiedExifTrackingTokenPayload>;

  if (payload.version !== EXIF_TRACKING_TOKEN_VERSION) {
    throw new Error("Unsupported EXIF tracking token version.");
  }

  if (
    typeof payload.serialHash !== "string" ||
    typeof payload.primaryCountValue !== "number" ||
    typeof payload.primaryCountType !== "string"
  ) {
    throw new Error("Invalid EXIF tracking token payload.");
  }

  return payload as VerifiedExifTrackingTokenPayload;
}

export async function buildTrackingPreviewFromParseResult(params: {
  status: ExifViewerResponse["status"];
  camera: CameraShape;
  extractor: ExtractorShape;
  metadataRows: ExifViewerMetadataRow[];
  userId?: string | null;
}): Promise<ExifViewerTrackingState> {
  if (params.status !== "success") {
    return createDefaultTrackingState("unsupported_result");
  }

  const serialRaw = extractExifSerialNumber(params.metadataRows);
  if (!serialRaw) {
    const matchedGear = await resolveMatchedGear({ camera: params.camera });

    return {
      ...createDefaultTrackingState("missing_serial"),
      matchedGear,
    };
  }

  const serialNormalized = normalizeExifSerial(serialRaw);
  const primaryCount = selectPrimaryExifCount(params.extractor);
  const matchedGear = await resolveMatchedGear({ camera: params.camera });

  if (!serialNormalized) {
    return {
      ...createDefaultTrackingState("missing_serial"),
      matchedGear,
    };
  }

  if (!primaryCount) {
    return {
      ...createDefaultTrackingState("missing_count"),
      matchedGear,
    };
  }

  const serialHash = hashExifSerial(serialNormalized);
  const captureAt = extractExifCaptureAt(params.metadataRows);

  if (!params.userId) {
    return {
      eligible: true,
      reason: "not_signed_in",
      saveToken: null,
      matchedGear,
      trackedCamera: null,
      currentReadingSaved: false,
    };
  }

  const data = await import("./data");
  const trackedPreview = await data.findTrackedCameraPreviewByUserAndSerialHash({
    userId: params.userId,
    serialHash,
  });

  const previewMatchedGear = trackedPreview?.matchedGear ?? matchedGear;
  let currentReadingSaved = false;

  if (trackedPreview?.trackedCamera) {
    const dedupeKey = buildExifReadingDedupeKey({
      trackedCameraId: trackedPreview.trackedCamera.id,
      primaryCountType: primaryCount.type,
      primaryCountValue: primaryCount.value,
      captureAt,
    });

    currentReadingSaved = await data.hasExifReadingByDedupeKey(dedupeKey);
  }

  const saveToken = currentReadingSaved
    ? null
    : await createSignedExifTrackingToken({
        version: EXIF_TRACKING_TOKEN_VERSION,
        serialHash,
        normalizedBrand: params.camera.normalizedBrand,
        makeRaw: params.camera.make,
        modelRaw: params.camera.model,
        matchedGearId: previewMatchedGear?.id ?? null,
        captureAt,
        primaryCountType: primaryCount.type,
        primaryCountValue: primaryCount.value,
        shutterCount: params.extractor.shutterCount,
        totalShutterCount: params.extractor.totalShutterCount,
        mechanicalShutterCount: params.extractor.mechanicalShutterCount,
        sourceTag: params.extractor.sourceTag,
        mechanicalSourceTag: params.extractor.mechanicalSourceTag,
      });

  return {
    eligible: true,
    reason: null,
    saveToken,
    matchedGear: previewMatchedGear,
    trackedCamera: trackedPreview?.trackedCamera ?? null,
    currentReadingSaved,
  };
}

export async function saveExifTrackingCandidate(params: {
  userId: string;
  token: string;
}) {
  const payload = await verifySignedExifTrackingToken(params.token);
  const data = await import("./data");
  const existingTrackedCamera = await data.findTrackedCameraPreviewByUserAndSerialHash({
    userId: params.userId,
    serialHash: payload.serialHash,
  });

  if (existingTrackedCamera?.trackedCamera) {
    const existingDedupeKey = buildExifReadingDedupeKey({
      trackedCameraId: existingTrackedCamera.trackedCamera.id,
      primaryCountType: payload.primaryCountType,
      primaryCountValue: payload.primaryCountValue,
      captureAt: payload.captureAt,
    });
    const alreadySaved = await data.hasExifReadingByDedupeKey(existingDedupeKey);

    if (alreadySaved) {
      return {
        ok: true,
        message: "Camera history already saved.",
        tracking: {
          eligible: true,
          reason: null,
          saveToken: null,
          matchedGear: existingTrackedCamera.matchedGear,
          trackedCamera: existingTrackedCamera.trackedCamera,
          currentReadingSaved: true,
        },
      };
    }
  }

  const seenAt = payload.captureAt ? new Date(payload.captureAt) : new Date();
  const trackedCamera = await data.upsertTrackedExifCamera({
    userId: params.userId,
    gearId: payload.matchedGearId,
    normalizedBrand:
      payload.normalizedBrand === "unknown" ? null : payload.normalizedBrand,
    makeRaw: payload.makeRaw,
    modelRaw: payload.modelRaw,
    serialHash: payload.serialHash,
    seenAt,
  });

  if (!trackedCamera?.trackedCamera) {
    throw new Error("Failed to persist EXIF tracking history.");
  }

  const dedupeKey = buildExifReadingDedupeKey({
    trackedCameraId: trackedCamera.trackedCamera.id,
    primaryCountType: payload.primaryCountType,
    primaryCountValue: payload.primaryCountValue,
    captureAt: payload.captureAt,
  });

  const persistedWithReading = await data.persistTrackedExifReading({
    trackedCameraId: trackedCamera.trackedCamera.id,
    dedupeKey,
    captureAt: payload.captureAt ? new Date(payload.captureAt) : null,
    primaryCountType: payload.primaryCountType,
    primaryCountValue: payload.primaryCountValue,
    shutterCount: payload.shutterCount,
    totalShutterCount: payload.totalShutterCount,
    mechanicalShutterCount: payload.mechanicalShutterCount,
    sourceTag: payload.sourceTag,
    mechanicalSourceTag: payload.mechanicalSourceTag,
  });

  return {
    ok: true,
    message: "Camera history saved.",
    tracking: {
      eligible: true,
      reason: null,
      saveToken: null,
      matchedGear: persistedWithReading?.matchedGear ?? null,
      trackedCamera: persistedWithReading?.trackedCamera ?? null,
      currentReadingSaved: true,
    },
  };
}

export async function fetchTrackedCameraHistory(params: {
  userId: string;
  trackedCameraId: string;
}): Promise<ExifTrackingHistoryResponse> {
  const data = await import("./data");
  const history = await data.fetchTrackedCameraHistoryById({
    userId: params.userId,
    trackedCameraId: params.trackedCameraId,
  });

  if (!history) {
    throw Object.assign(new Error("Tracked camera not found."), { status: 404 });
  }

  return history;
}

export async function deleteExifTrackedReading(params: {
  userId: string;
  readingId: string;
}): Promise<ExifTrackingDeleteResponse> {
  const data = await import("./data");
  const deleted = await data.deleteTrackedExifReading({
    userId: params.userId,
    readingId: params.readingId,
  });

  if (!deleted) {
    throw Object.assign(new Error("Saved EXIF reading not found."), {
      status: 404,
    });
  }

  return {
    ok: true,
    message: "Saved EXIF reading deleted.",
    deletedReadingId: deleted.deletedReadingId,
    trackedCamera: deleted.trackedCamera,
    matchedGear: deleted.matchedGear,
  };
}
