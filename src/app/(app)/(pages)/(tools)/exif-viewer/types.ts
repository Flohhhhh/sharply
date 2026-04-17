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
export const EXIF_VIEWER_MAX_JSON_BODY_BYTES = 3 * 1024 * 1024;
export const EXIF_VIEWER_MAX_TAG_ENTRIES = 4000;
export const EXIF_VIEWER_MAX_TAG_FIELD_LENGTH = 512;
export const EXIF_VIEWER_MAX_WARNING_COUNT = 100;
export const EXIF_VIEWER_MAX_WARNING_LENGTH = 500;

export const EXIF_VIEWER_SERIAL_CANDIDATE_KEYS = [
  "MakerNotes:SerialNumber",
  "MakerNotes:InternalSerialNumber",
  "MakerNotes:CameraSerialNumber",
  "EXIF:SerialNumber",
  "ExifIFD:SerialNumber",
  "Composite:SerialNumber",
  "Nikon:SerialNumber",
  "Canon:SerialNumber",
  "Sony:SerialNumber",
  "FujiFilm:SerialNumber",
] as const;

export const EXIF_VIEWER_CAPTURE_DATE_CANDIDATE_KEYS = [
  "Composite:SubSecDateTimeOriginal",
  "EXIF:DateTimeOriginal",
  "EXIF:CreateDate",
] as const;

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
export type ExifViewerParser = "exiftool-wasm";

export type ExifTrackingPrimaryCountType =
  | ExifViewerCountType
  | "generic";

export type ExifTrackingChartSeries =
  | "generic"
  | "total"
  | "mechanical";

export type ExifViewerTagEntry = {
  key: string;
  group: string;
  tag: string;
  value: unknown;
};

export type ExifViewerParseRequest = {
  file: {
    name: string;
    size: number;
  };
  exiftool: {
    parser: ExifViewerParser;
    allTags: ExifViewerTagEntry[];
    warnings: string[];
  };
};

export type ExifViewerMetadataRow = {
  key: string;
  group: string;
  tag: string;
  value: string;
};

export type ExifViewerMatchedGear = {
  id: string;
  slug: string;
  name: string;
};

export type ExifTrackedCameraSummary = {
  id: string;
  readingCount: number;
  latestPrimaryCountValue: number | null;
  latestCaptureAt: string | null;
};

export type ExifViewerTrackingReason =
  | "missing_serial"
  | "missing_count"
  | "not_signed_in"
  | "unsupported_result"
  | null;

export type ExifViewerTrackingState = {
  eligible: boolean;
  reason: ExifViewerTrackingReason;
  saveToken: string | null;
  matchedGear: ExifViewerMatchedGear | null;
  trackedCamera: ExifTrackedCameraSummary | null;
  currentReadingSaved: boolean;
};

export type ExifTrackingSaveResponse = {
  ok: boolean;
  message: string;
  tracking: ExifViewerTrackingState | null;
};

export type ExifTrackedCameraHistoryEntry = {
  id: string;
  captureAt: string | null;
  primaryCountType: ExifTrackingPrimaryCountType;
  primaryCountValue: number;
  shutterCount: number | null;
  totalShutterCount: number | null;
  mechanicalShutterCount: number | null;
  createdAt: string;
};

export type ExifTrackingHistoryResponse = {
  ok: boolean;
  trackedCamera: {
    id: string;
    title: string;
    matchedGear: ExifViewerMatchedGear | null;
    readingCount: number;
    latestPrimaryCountValue: number | null;
    latestCaptureAt: string | null;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
  } | null;
  readings: ExifTrackedCameraHistoryEntry[];
};

export type ExifTrackingDeleteResponse = {
  ok: boolean;
  message: string;
  deletedReadingId: string | null;
  trackedCamera: ExifTrackedCameraSummary | null;
  matchedGear: ExifViewerMatchedGear | null;
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
  tracking: ExifViewerTrackingState;
  metadata: {
    rows: ExifViewerMetadataRow[];
  };
  debug: {
    parser: ExifViewerParser;
    tagCount: number;
    warnings: string[];
    relevantTags: ExifViewerTagEntry[];
    attempts: ExifViewerExtractorAttempt[];
  };
};
