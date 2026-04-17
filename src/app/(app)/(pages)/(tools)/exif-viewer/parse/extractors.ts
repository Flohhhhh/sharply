import {
  type ExifViewerCountType,
  type ExifViewerExtractorAttempt,
  type ExifViewerResponse,
  type ExifViewerTagEntry,
  type NormalizedCameraBrand,
} from "../types";

type BrandDetectionResult = ExifViewerResponse["camera"];

type ExtractorDefinition = {
  id: string;
  candidateTags: string[];
  run: (tagEntries: ExifViewerTagEntry[]) => ExifViewerExtractorAttempt;
};

type ExtractionResult = {
  camera: BrandDetectionResult;
  status: ExifViewerResponse["status"];
  message: string;
  selectedExtractor: string | null;
  primaryExtractor: string | null;
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
  attempts: ExifViewerExtractorAttempt[];
};

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCountValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const normalizedDigits = trimmed.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(normalizedDigits)) return null;

  const parsed = Number.parseInt(normalizedDigits, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function findTagValue(
  tagEntries: ExifViewerTagEntry[],
  candidates: string[],
): ExifViewerTagEntry | null {
  for (const candidate of candidates) {
    const lowerCandidate = candidate.toLowerCase();
    const exact = tagEntries.find((entry) => entry.key.toLowerCase() === lowerCandidate);
    if (exact) return exact;
  }

  for (const candidate of candidates) {
    const lowerCandidate = candidate.toLowerCase();
    const exactTag = tagEntries.find(
      (entry) => entry.tag.toLowerCase() === lowerCandidate,
    );
    if (exactTag) return exactTag;
  }

  return null;
}

function findCameraField(
  tagEntries: ExifViewerTagEntry[],
  tagCandidates: string[],
): string | null {
  const match = findTagValue(tagEntries, tagCandidates);
  return normalizeString(match?.value);
}

function buildAttempt(
  extractorId: string,
  candidateTags: string[],
  tagEntries: ExifViewerTagEntry[],
  countType: ExifViewerCountType = "total",
): ExifViewerExtractorAttempt {
  const checks = candidateTags.map((candidateTag) => {
    const match = findTagValue(tagEntries, [candidateTag]);
    const normalizedValue = normalizeCountValue(match?.value);

    return {
      countType,
      candidateTag,
      matchedTag: match?.key ?? null,
      rawValue: match?.value ?? null,
      normalizedValue,
      valid: normalizedValue !== null,
    };
  });

  const winningCheck = checks.find((check) => check.valid);
  const matchedChecks = checks.filter((check) => check.matchedTag !== null);

  let reason = "No supported tags were present.";
  if (winningCheck) {
    reason = "Resolved a valid shutter count.";
  } else if (matchedChecks.length > 0) {
    reason = "Found candidate tags, but none contained a valid positive integer.";
  }

  return {
    extractorId,
    candidateTags,
    checks,
    matchedTagCount: matchedChecks.length,
    countType: winningCheck ? countType : null,
    sourceTag: winningCheck?.matchedTag ?? null,
    mechanicalSourceTag: null,
    rawValue: winningCheck?.rawValue ?? null,
    shutterCount: winningCheck?.normalizedValue ?? null,
    totalShutterCount:
      countType === "total" ? (winningCheck?.normalizedValue ?? null) : null,
    mechanicalShutterCount:
      countType === "mechanical" ? (winningCheck?.normalizedValue ?? null) : null,
    reason,
  };
}

export function detectCameraBrand(
  tagEntries: ExifViewerTagEntry[],
): BrandDetectionResult {
  const make = findCameraField(tagEntries, [
    "EXIF:Make",
    "IFD0:Make",
    "MakerNotes:Make",
    "Make",
  ]);
  const model = findCameraField(tagEntries, [
    "EXIF:Model",
    "IFD0:Model",
    "MakerNotes:Model",
    "Model",
  ]);

  const haystack = `${make ?? ""} ${model ?? ""}`.toUpperCase();

  let normalizedBrand: NormalizedCameraBrand = "unknown";
  if (
    haystack.includes("SONY") ||
    haystack.includes("ILCE") ||
    haystack.includes("ILME") ||
    haystack.includes("NEX") ||
    haystack.includes("DSC-") ||
    haystack.includes("ZV-E")
  ) {
    normalizedBrand = "sony";
  } else if (haystack.includes("NIKON") || haystack.includes("COOLPIX")) {
    normalizedBrand = "nikon";
  } else if (
    haystack.includes("CANON") ||
    haystack.includes("EOS") ||
    haystack.includes("POWERSHOT") ||
    haystack.includes("IXUS")
  ) {
    normalizedBrand = "canon";
  } else if (
    haystack.includes("FUJIFILM") ||
    haystack.includes("FUJI") ||
    haystack.includes("GFX") ||
    haystack.includes("X-T") ||
    haystack.includes("X-H") ||
    haystack.includes("X-S") ||
    haystack.includes("X100")
  ) {
    normalizedBrand = "fujifilm";
  }

  return {
    make,
    model,
    normalizedBrand,
  };
}

export function extractSonyShutterCount(tagEntries: ExifViewerTagEntry[]) {
  return buildAttempt(
    "sony",
    [
      "Sony:ShutterCount",
      "Sony:ShutterCount2",
      "Sony:ImageCount",
      "MakerNotes:ShutterCount",
      "MakerNotes:ShutterCount2",
      "MakerNotes:ImageCount",
    ],
    tagEntries,
  );
}

export function extractNikonShutterCount(tagEntries: ExifViewerTagEntry[]) {
  const totalAttempt = buildAttempt(
    "nikon",
    ["Nikon:ShutterCount", "MakerNotes:ShutterCount"],
    tagEntries,
    "total",
  );
  const mechanicalAttempt = buildAttempt(
    "nikon",
    [
      "Nikon:MechanicalShutterCount",
      "MakerNotes:MechanicalShutterCount",
    ],
    tagEntries,
    "mechanical",
  );

  const checks = [...totalAttempt.checks, ...mechanicalAttempt.checks];
  const matchedTagCount = checks.filter((check) => check.matchedTag !== null).length;
  const totalShutterCount = totalAttempt.shutterCount;
  const mechanicalShutterCount = mechanicalAttempt.shutterCount;
  const countType: ExifViewerCountType | null =
    totalShutterCount !== null ? "total" : null;

  let reason = "No supported Nikon shutter tags were present.";
  if (totalShutterCount !== null && mechanicalShutterCount !== null) {
    reason = "Resolved total and mechanical Nikon shutter counts.";
  } else if (totalShutterCount !== null) {
    reason = "Resolved total Nikon shutter count.";
  } else if (mechanicalShutterCount !== null) {
    reason =
      "Resolved mechanical Nikon shutter count only. Total shutter count was not found.";
  } else if (matchedTagCount > 0) {
    reason =
      "Found Nikon shutter-count tags, but none contained a valid positive integer.";
  }

  return {
    extractorId: "nikon",
    candidateTags: [
      ...totalAttempt.candidateTags,
      ...mechanicalAttempt.candidateTags,
    ],
    checks,
    matchedTagCount,
    countType,
    sourceTag: totalAttempt.sourceTag,
    mechanicalSourceTag: mechanicalAttempt.sourceTag,
    rawValue: totalAttempt.rawValue,
    shutterCount: totalShutterCount,
    totalShutterCount,
    mechanicalShutterCount,
    reason,
  };
}

export function extractCanonShutterCount(tagEntries: ExifViewerTagEntry[]) {
  return buildAttempt(
    "canon",
    [
      "Canon:ShutterCount",
      "FileInfo:ShutterCount",
      "MakerNotes:ShutterCount",
    ],
    tagEntries,
  );
}

export function extractFujifilmShutterCount(tagEntries: ExifViewerTagEntry[]) {
  return buildAttempt(
    "fujifilm",
    [
      "FujiFilm:ShutterCount",
      "FujiFilm:ExposureCount",
      "FujiFilm:ImageCount",
      "MakerNotes:ShutterCount",
      "MakerNotes:ExposureCount",
    ],
    tagEntries,
  );
}

export function extractGenericShutterCount(tagEntries: ExifViewerTagEntry[]) {
  const candidateTags = tagEntries
    .filter((entry) => {
      const lowerTag = entry.tag.toLowerCase();
      return (
        lowerTag.includes("shuttercount") ||
        lowerTag === "shuttercount" ||
        lowerTag.includes("imagecount") ||
        lowerTag === "imagecount" ||
        lowerTag.includes("exposurecount") ||
        lowerTag === "exposurecount" ||
        lowerTag.includes("actuation")
      );
    })
    .map((entry) => entry.key);

  return buildAttempt("generic", candidateTags, tagEntries);
}

const EXTRACTOR_REGISTRY: Record<
  Exclude<NormalizedCameraBrand, "unknown">,
  ExtractorDefinition
> = {
  sony: {
    id: "sony",
    candidateTags: [],
    run: extractSonyShutterCount,
  },
  nikon: {
    id: "nikon",
    candidateTags: [],
    run: extractNikonShutterCount,
  },
  canon: {
    id: "canon",
    candidateTags: [],
    run: extractCanonShutterCount,
  },
  fujifilm: {
    id: "fujifilm",
    candidateTags: [],
    run: extractFujifilmShutterCount,
  },
};

function collectRawValuesInspected(attempts: ExifViewerExtractorAttempt[]) {
  return attempts.flatMap((attempt) =>
    attempt.checks
      .filter((check) => check.matchedTag !== null)
      .map((check) => ({
        tag: check.matchedTag!,
        value: check.rawValue,
      })),
  );
}

function attemptHasInvalidValue(attempt: ExifViewerExtractorAttempt) {
  return attempt.checks.some(
    (check) => check.matchedTag !== null && check.normalizedValue === null,
  );
}

export function extractShutterCount(
  tagEntries: ExifViewerTagEntry[],
): ExtractionResult {
  const camera = detectCameraBrand(tagEntries);
  const primaryExtractor =
    camera.normalizedBrand === "unknown"
      ? null
      : EXTRACTOR_REGISTRY[camera.normalizedBrand];

  const attempts: ExifViewerExtractorAttempt[] = [];

  if (primaryExtractor) {
    attempts.push(primaryExtractor.run(tagEntries));
  }

  const primaryAttempt = attempts[0];
  if (
    primaryAttempt &&
    (primaryAttempt.totalShutterCount !== null ||
      primaryAttempt.mechanicalShutterCount !== null ||
      primaryAttempt.shutterCount !== null)
  ) {
    return {
      camera,
      status: "success",
      message: "Shutter count found.",
      selectedExtractor: primaryAttempt.extractorId,
      primaryExtractor: primaryAttempt.extractorId,
      fallbackUsed: false,
      countType: primaryAttempt.countType,
      sourceTag: primaryAttempt.sourceTag,
      mechanicalSourceTag: primaryAttempt.mechanicalSourceTag,
      shutterCount: primaryAttempt.shutterCount,
      totalShutterCount: primaryAttempt.totalShutterCount,
      mechanicalShutterCount: primaryAttempt.mechanicalShutterCount,
      failureReason: null,
      candidateTagsChecked: primaryAttempt.candidateTags,
      rawValuesInspected: collectRawValuesInspected(attempts),
      attempts,
    };
  }

  const genericAttempt = extractGenericShutterCount(tagEntries);
  attempts.push(genericAttempt);

  if (genericAttempt.shutterCount !== null) {
    return {
      camera,
      status: "success",
      message: primaryExtractor
        ? "Shutter count found through fallback extraction."
        : "Shutter count found.",
      selectedExtractor: genericAttempt.extractorId,
      primaryExtractor: primaryExtractor?.id ?? null,
      fallbackUsed: primaryExtractor !== null,
      countType: genericAttempt.countType,
      sourceTag: genericAttempt.sourceTag,
      mechanicalSourceTag: genericAttempt.mechanicalSourceTag,
      shutterCount: genericAttempt.shutterCount,
      totalShutterCount: genericAttempt.totalShutterCount,
      mechanicalShutterCount: genericAttempt.mechanicalShutterCount,
      failureReason: null,
      candidateTagsChecked: genericAttempt.candidateTags,
      rawValuesInspected: collectRawValuesInspected(attempts),
      attempts,
    };
  }

  const hasInvalidValue = attempts.some(attemptHasInvalidValue);

  let status: ExtractionResult["status"] = "not_found";
  let message = "No shutter count tag was found.";
  if (hasInvalidValue) {
    status = "invalid_value";
    message = "Candidate shutter-count tags were found, but the values were unusable.";
  } else if (camera.normalizedBrand === "unknown") {
    status = "unsupported_brand";
    message = "Camera brand could not be identified for a brand-specific extractor.";
  }

  return {
    camera,
    status,
    message,
    selectedExtractor: genericAttempt.extractorId,
    primaryExtractor: primaryExtractor?.id ?? null,
    fallbackUsed: primaryExtractor !== null,
    countType: null,
    sourceTag: null,
    mechanicalSourceTag: null,
    shutterCount: null,
    totalShutterCount: null,
    mechanicalShutterCount: null,
    failureReason: attempts.at(-1)?.reason ?? message,
    candidateTagsChecked: attempts.flatMap((attempt) => attempt.candidateTags),
    rawValuesInspected: collectRawValuesInspected(attempts),
    attempts,
  };
}
