import "server-only";

import sharp from "sharp";
import { UTApi } from "uploadthing/server";
import type { AuthUser } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import {
  extractUploadThingFileKey,
  isUploadThingFileUrl,
} from "~/server/raw-samples/uploadthing";
import {
  LLM_GEAR_IMAGE_REVIEW_REASONS,
  reviewGearImageWithLlm,
} from "./llm";

export type GearImageReviewImageType =
  | "thumbnail"
  | "front"
  | "topView"
  | "rearView"
  | "leftView"
  | "rightView";

export type GearImageReviewContext = {
  actor: AuthUser;
  gearId: string;
  imageType: GearImageReviewImageType;
  imageUrl: string;
};

export type GearImageReviewCheckResult =
  | { status: "passed" }
  | { status: "blocked"; reason: string };

export type GearImageReviewCheck = (
  context: GearImageReviewContext,
) => Promise<GearImageReviewCheckResult> | GearImageReviewCheckResult;

export type GearImageReviewResult =
  | { status: "passed"; checksRun: number }
  | { status: "skipped"; checksRun: 0 };

export type GearImageReviewRunResult =
  | { status: "passed"; checksRun: number }
  | { status: "blocked"; checksRun: number; reason: string };

const MINIMUM_GEAR_IMAGE_LONG_EDGE = 800;
const MAX_GEAR_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 10_000;

export const GEAR_IMAGE_REVIEW_REASONS = {
  INVALID_UPLOAD_URL: "INVALID_UPLOAD_URL",
  IMAGE_TOO_SMALL: "IMAGE_TOO_SMALL",
  IMAGE_UNREADABLE: "IMAGE_UNREADABLE",
  ...LLM_GEAR_IMAGE_REVIEW_REASONS,
} as const;

export async function minimumImageLongEdgeCheck(
  context: GearImageReviewContext,
): Promise<GearImageReviewCheckResult> {
  try {
    const response = await fetch(context.imageUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return {
        status: "blocked",
        reason: GEAR_IMAGE_REVIEW_REASONS.IMAGE_UNREADABLE,
      };
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_GEAR_IMAGE_BYTES) {
      return { status: "blocked", reason: GEAR_IMAGE_REVIEW_REASONS.IMAGE_UNREADABLE };
    }
    const imageBytes = Buffer.from(await response.arrayBuffer());
    if (imageBytes.byteLength > MAX_GEAR_IMAGE_BYTES) {
      return { status: "blocked", reason: GEAR_IMAGE_REVIEW_REASONS.IMAGE_UNREADABLE };
    }
    const metadata = await sharp(imageBytes).metadata();
    const longEdge = Math.max(metadata.width ?? 0, metadata.height ?? 0);
    if (longEdge < MINIMUM_GEAR_IMAGE_LONG_EDGE) {
      return {
        status: "blocked",
        reason: GEAR_IMAGE_REVIEW_REASONS.IMAGE_TOO_SMALL,
      };
    }
  } catch {
    return {
      status: "blocked",
      reason: GEAR_IMAGE_REVIEW_REASONS.IMAGE_UNREADABLE,
    };
  }

  return { status: "passed" };
}

/**
 * Runs after structural checks so only viable image uploads reach OpenRouter.
 */
export async function llmImageReviewCheck(
  context: GearImageReviewContext,
): Promise<GearImageReviewCheckResult> {
  return reviewGearImageWithLlm(context);
}

/**
 * Add future server-side image checks here. Checks receive an UploadThing URL
 * after the blob upload but before that URL is attached to any gear record.
 */
export const gearImageReviewChecks: readonly GearImageReviewCheck[] = [
  minimumImageLongEdgeCheck,
  llmImageReviewCheck,
];

async function deleteRejectedUpload(imageUrl: string) {
  const fileKey = extractUploadThingFileKey(imageUrl);
  if (!fileKey || !process.env.UPLOADTHING_TOKEN) return;

  try {
    await new UTApi({ token: process.env.UPLOADTHING_TOKEN }).deleteFiles(
      fileKey,
    );
  } catch (error) {
    // A failed cleanup must never allow a rejected image to be persisted.
    console.error("Failed to delete rejected gear image upload", error);
  }
}

export async function runGearImageReviewChecks(
  context: GearImageReviewContext,
  checks: readonly GearImageReviewCheck[] = gearImageReviewChecks,
): Promise<GearImageReviewRunResult> {
  for (let index = 0; index < checks.length; index++) {
    const result = await checks[index]!(context);
    if (result.status === "blocked") {
      return { status: "blocked", checksRun: index + 1, reason: result.reason };
    }
  }

  return { status: "passed", checksRun: checks.length };
}

export async function reviewGearImageUpload(
  context: GearImageReviewContext,
): Promise<GearImageReviewResult> {
  if (!requireRole(context.actor, ["EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  if (requireRole(context.actor, ["ADMIN"])) {
    return { status: "skipped", checksRun: 0 };
  }

  if (!isUploadThingFileUrl(context.imageUrl)) {
    throw Object.assign(
      new Error(`GEAR_IMAGE_REVIEW_REJECTED:${GEAR_IMAGE_REVIEW_REASONS.INVALID_UPLOAD_URL}`),
      { status: 422, code: "GEAR_IMAGE_REVIEW_REJECTED" },
    );
  }

  const result = await runGearImageReviewChecks(context);
  if (result.status === "blocked") {
    await deleteRejectedUpload(context.imageUrl);
    throw Object.assign(
      new Error(`GEAR_IMAGE_REVIEW_REJECTED:${result.reason}`),
      {
        status: 422,
        code: "GEAR_IMAGE_REVIEW_REJECTED",
      },
    );
  }

  return result;
}
