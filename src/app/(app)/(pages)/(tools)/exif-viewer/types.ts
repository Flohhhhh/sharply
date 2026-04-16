export const EXIF_VIEWER_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "dng",
  "arw",
  "nef",
  "cr2",
  "cr3",
  "raf",
] as const;

export const EXIF_VIEWER_MAX_FILE_BYTES = 100 * 1024 * 1024;

export type SupportedExifViewerExtension =
  (typeof EXIF_VIEWER_ALLOWED_EXTENSIONS)[number];

export type NormalizedCameraBrand =
  | "sony"
  | "nikon"
  | "canon"
  | "fujifilm"
  | "unknown";

export type ExifViewerStatus =
  | "success"
  | "unsupported_format"
  | "file_too_large"
  | "parse_error"
  | "unsupported_brand"
  | "not_found"
  | "invalid_value";

export type ExifViewerCountType = "total" | "mechanical";

export type ExifViewerTagEntry = {
  key: string;
  group: string;
  tag: string;
  value: unknown;
};

export type ExifViewerCandidateCheck = {
  countType: ExifViewerCountType;
  candidateTag: string;
  matchedTag: string | null;
  rawValue: unknown;
  normalizedValue: number | null;
  valid: boolean;
};

export type ExifViewerExtractorAttempt = {
  extractorId: string;
  candidateTags: string[];
  checks: ExifViewerCandidateCheck[];
  matchedTagCount: number;
  countType: ExifViewerCountType | null;
  sourceTag: string | null;
  mechanicalSourceTag: string | null;
  rawValue: unknown;
  shutterCount: number | null;
  totalShutterCount: number | null;
  mechanicalShutterCount: number | null;
  reason: string;
};

export type ExifViewerResponse = {
  ok: boolean;
  status: ExifViewerStatus;
  message: string;
  file: {
    name: string;
    extension: string;
    size: number;
  };
  camera: {
    make: string | null;
    model: string | null;
    normalizedBrand: NormalizedCameraBrand;
  };
  extractor: {
    selected: string | null;
    primary: string | null;
    fallbackUsed: boolean;
    countType: ExifViewerCountType | null;
    sourceTag: string | null;
    mechanicalSourceTag: string | null;
    shutterCount: number | null;
    totalShutterCount: number | null;
    mechanicalShutterCount: number | null;
    failureReason: string | null;
    candidateTagsChecked: string[];
    rawValuesInspected: Array<{
      tag: string;
      value: unknown;
    }>;
  };
  debug: {
    parser: "exiftool-vendored";
    tagCount: number;
    warnings: string[];
    relevantTags: ExifViewerTagEntry[];
    attempts: ExifViewerExtractorAttempt[];
  };
};
