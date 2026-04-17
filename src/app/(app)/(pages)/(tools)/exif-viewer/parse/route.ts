import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/auth";
import { buildTrackingPreviewFromParseResult } from "~/server/exif-tracking/service";
import {
  EXIF_VIEWER_ALLOWED_EXTENSIONS,
  EXIF_VIEWER_MAX_FILE_BYTES,
  EXIF_VIEWER_MAX_JSON_BODY_BYTES,
  EXIF_VIEWER_MAX_TAG_ENTRIES,
  EXIF_VIEWER_MAX_TAG_FIELD_LENGTH,
  EXIF_VIEWER_MAX_WARNING_COUNT,
  EXIF_VIEWER_MAX_WARNING_LENGTH,
  type ExifViewerParseRequest,
  type ExifViewerResponse,
} from "../types";
import {
  filterRelevantExifToolTags,
  sanitizeExifViewerTagEntries,
  toExifViewerMetadataRows,
} from "./exiftool";
import { extractShutterCount } from "./extractors";

export const runtime = "nodejs";

const trimmedStringSchema = z
  .string()
  .min(1)
  .max(EXIF_VIEWER_MAX_TAG_FIELD_LENGTH)
  .transform((value) => value.trim())
  .refine((value) => value.length > 0);

const exifViewerTagEntrySchema = z.object({
  key: trimmedStringSchema,
  group: trimmedStringSchema,
  tag: trimmedStringSchema,
  value: z.unknown(),
});

const exifViewerParseRequestSchema = z.object({
  file: z.object({
    name: z.string().min(1).max(512),
    size: z.number().int().nonnegative(),
  }),
  exiftool: z.object({
    parser: z.literal("exiftool-wasm"),
    allTags: z.array(exifViewerTagEntrySchema).max(EXIF_VIEWER_MAX_TAG_ENTRIES),
    warnings: z
      .array(z.string().max(EXIF_VIEWER_MAX_WARNING_LENGTH))
      .max(EXIF_VIEWER_MAX_WARNING_COUNT),
  }),
});

function getExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.at(-1)!.toLowerCase() : "";
}

function createResponse(
  payload: ExifViewerResponse,
  init?: ResponseInit,
): NextResponse<ExifViewerResponse> {
  return NextResponse.json(payload, init);
}

function createErrorResponse(params: {
  status: ExifViewerResponse["status"];
  message: string;
  fileName: string;
  fileSize: number;
  httpStatus?: number;
}) {
  const extension = getExtension(params.fileName);

  return createResponse(
    {
      ok: false,
      status: params.status,
      message: params.message,
      file: {
        name: params.fileName,
        extension,
        size: params.fileSize,
      },
      camera: {
        make: null,
        model: null,
        normalizedBrand: "unknown",
      },
      extractor: {
        selected: null,
        primary: null,
        fallbackUsed: false,
        countType: null,
        sourceTag: null,
        mechanicalSourceTag: null,
        shutterCount: null,
        totalShutterCount: null,
        mechanicalShutterCount: null,
        failureReason: params.message,
        candidateTagsChecked: [],
        rawValuesInspected: [],
      },
      tracking: {
        eligible: false,
        reason: "unsupported_result",
        saveToken: null,
        matchedGear: null,
        trackedCamera: null,
        currentReadingSaved: false,
      },
      metadata: {
        rows: [],
      },
      debug: {
        parser: "exiftool-wasm",
        tagCount: 0,
        warnings: [],
        relevantTags: [],
        attempts: [],
      },
    },
    {
      status:
        params.httpStatus ??
        (params.status === "parse_error"
          ? 500
          : params.status === "unsupported_format" ||
                params.status === "file_too_large"
              ? 400
              : 200),
    },
  );
}

async function parseRequestBody(request: Request): Promise<ExifViewerParseRequest> {
  const body = await request.text();

  if (!body.trim()) {
    throw new Error("Missing EXIF metadata payload.");
  }

  if (new TextEncoder().encode(body).length > EXIF_VIEWER_MAX_JSON_BODY_BYTES) {
    throw new Error("Metadata payload is too large.");
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(body);
  } catch {
    throw new Error("Invalid EXIF metadata payload.");
  }

  const result = exifViewerParseRequestSchema.safeParse(parsedBody);

  if (!result.success) {
    throw new Error("Invalid EXIF metadata payload.");
  }

  return result.data as ExifViewerParseRequest;
}

export async function POST(request: Request) {
  let parsedRequest: ExifViewerParseRequest;

  try {
    parsedRequest = await parseRequestBody(request);
  } catch (error) {
    return createErrorResponse({
      status: "parse_error",
      message:
        error instanceof Error ? error.message : "Invalid EXIF metadata payload.",
      fileName: "unknown",
      fileSize: 0,
      httpStatus: 400,
    });
  }

  const {
    file: { name: fileName, size: fileSize },
    exiftool,
  } = parsedRequest;
  const extension = getExtension(fileName);

  if (!EXIF_VIEWER_ALLOWED_EXTENSIONS.includes(extension as never)) {
    return createErrorResponse({
      status: "unsupported_format",
      message: `Unsupported file type. Supported extensions: ${EXIF_VIEWER_ALLOWED_EXTENSIONS.join(", ")}.`,
      fileName,
      fileSize,
    });
  }

  if (fileSize === 0) {
    return createErrorResponse({
      status: "parse_error",
      message: "The selected file is empty.",
      fileName,
      fileSize,
      httpStatus: 400,
    });
  }

  if (fileSize > EXIF_VIEWER_MAX_FILE_BYTES) {
    return createErrorResponse({
      status: "file_too_large",
      message: `File exceeds the ${Math.round(EXIF_VIEWER_MAX_FILE_BYTES / 1024 / 1024)}MB limit.`,
      fileName,
      fileSize,
    });
  }

  try {
    const allTags = sanitizeExifViewerTagEntries(exiftool.allTags);
    const relevantTags = filterRelevantExifToolTags(allTags);
    const metadataRows = toExifViewerMetadataRows(allTags);
    const extraction = extractShutterCount(relevantTags);
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const tracking = await buildTrackingPreviewFromParseResult({
      status: extraction.status,
      camera: extraction.camera,
      extractor: {
        selected: extraction.selectedExtractor,
        primary: extraction.primaryExtractor,
        fallbackUsed: extraction.fallbackUsed,
        countType: extraction.countType,
        sourceTag: extraction.sourceTag,
        mechanicalSourceTag: extraction.mechanicalSourceTag,
        shutterCount: extraction.shutterCount,
        totalShutterCount: extraction.totalShutterCount,
        mechanicalShutterCount: extraction.mechanicalShutterCount,
        failureReason: extraction.failureReason,
        candidateTagsChecked: extraction.candidateTagsChecked,
        rawValuesInspected: extraction.rawValuesInspected,
      },
      metadataRows,
      userId: session?.user.id ?? null,
    });

    return createResponse({
      ok: extraction.status === "success",
      status: extraction.status,
      message: extraction.message,
      file: {
        name: fileName,
        extension,
        size: fileSize,
      },
      camera: extraction.camera,
      extractor: {
        selected: extraction.selectedExtractor,
        primary: extraction.primaryExtractor,
        fallbackUsed: extraction.fallbackUsed,
        countType: extraction.countType,
        sourceTag: extraction.sourceTag,
        mechanicalSourceTag: extraction.mechanicalSourceTag,
        shutterCount: extraction.shutterCount,
        totalShutterCount: extraction.totalShutterCount,
        mechanicalShutterCount: extraction.mechanicalShutterCount,
        failureReason: extraction.failureReason,
        candidateTagsChecked: extraction.candidateTagsChecked,
        rawValuesInspected: extraction.rawValuesInspected,
      },
      tracking,
      metadata: {
        rows: metadataRows,
      },
      debug: {
        parser: exiftool.parser,
        tagCount: allTags.length,
        warnings: exiftool.warnings,
        relevantTags,
        attempts: extraction.attempts,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse metadata.";

    return createErrorResponse({
      status: "parse_error",
      message,
      fileName,
      fileSize,
    });
  }
}
