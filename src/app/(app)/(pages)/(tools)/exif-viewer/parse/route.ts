import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "~/auth";
import {
  EXIF_VIEWER_ALLOWED_EXTENSIONS,
  EXIF_VIEWER_MAX_FILE_BYTES,
  type ExifViewerResponse,
} from "../types";
import { readExifToolTags, toExifViewerMetadataRows } from "./exiftool";
import { extractShutterCount } from "./extractors";
import { buildTrackingPreviewFromParseResult } from "~/server/exif-tracking/service";

export const runtime = "nodejs";

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
        parser: "exiftool-vendored",
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

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return createErrorResponse({
      status: "parse_error",
      message: "Missing file upload.",
      fileName: "unknown",
      fileSize: 0,
      httpStatus: 400,
    });
  }

  const extension = getExtension(file.name);
  if (!EXIF_VIEWER_ALLOWED_EXTENSIONS.includes(extension as never)) {
    return createErrorResponse({
      status: "unsupported_format",
      message: `Unsupported file type. Supported extensions: ${EXIF_VIEWER_ALLOWED_EXTENSIONS.join(", ")}.`,
      fileName: file.name,
      fileSize: file.size,
    });
  }

  if (file.size === 0) {
    return createErrorResponse({
      status: "parse_error",
      message: "The uploaded file is empty.",
      fileName: file.name,
      fileSize: file.size,
      httpStatus: 400,
    });
  }

  if (file.size > EXIF_VIEWER_MAX_FILE_BYTES) {
    return createErrorResponse({
      status: "file_too_large",
      message: `File exceeds the ${Math.round(EXIF_VIEWER_MAX_FILE_BYTES / 1024 / 1024)}MB limit.`,
      fileName: file.name,
      fileSize: file.size,
    });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { allTags, rawTags, relevantTags, warnings } = await readExifToolTags({
      fileName: file.name,
      buffer: new Uint8Array(arrayBuffer),
    });
    const extraction = extractShutterCount(relevantTags);
    const metadataRows = toExifViewerMetadataRows(allTags);
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

    return createResponse(
      {
        ok: extraction.status === "success",
        status: extraction.status,
        message: extraction.message,
        file: {
          name: file.name,
          extension,
          size: file.size,
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
          parser: "exiftool-vendored",
          tagCount: Object.keys(rawTags).length,
          warnings,
          relevantTags,
          attempts: extraction.attempts,
        },
      },
      {
        status: extraction.status === "success" ? 200 : 200,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse metadata.";

    return createErrorResponse({
      status: "parse_error",
      message,
      fileName: file.name,
      fileSize: file.size,
    });
  }
}
