import { BRANDS, MOUNTS, SENSOR_FORMATS } from "~/lib/constants";

export const BULK_IMPORT_HEADERS = [
  "name",
  "modelNumber",
  "mounts",
  "releaseDate",
  "announcedDate",
  "msrpNowUsd",
  "msrpAtLaunchUsd",
  "weightGrams",
  "imageCircleSize",
  "hasAutofocus",
  "hasStabilization",
  "isMacro",
  "frontFilterThreadSizeMm",
  "hasWeatherSealing",
] as const;

export type BulkImportHeader = (typeof BULK_IMPORT_HEADERS)[number];

export type BulkImportValidationMessage = {
  level: "error" | "warning";
  message: string;
};

export type BulkImportParsedRow = {
  rowNumber: number;
  raw: Partial<Record<BulkImportHeader, string>>;
  name: string;
  modelNumber?: string;
  brandId?: string;
  brandName?: string;
  mountIds: string[];
  mountValues: string[];
  core: {
    announcedDate?: string;
    releaseDate?: string;
    msrpNowUsdCents?: number;
    msrpAtLaunchUsdCents?: number;
    weightGrams?: number;
  };
  lens: {
    isPrime?: boolean;
    focalLengthMinMm?: number;
    focalLengthMaxMm?: number;
    imageCircleSizeId?: string;
    maxApertureWide?: number;
    maxApertureTele?: number;
    hasAutofocus?: boolean;
    hasStabilization?: boolean;
    isMacro?: boolean;
    frontFilterThreadSizeMm?: number;
    hasWeatherSealing?: boolean;
  };
  inferred: {
    focalLength: boolean;
    aperture: boolean;
  };
  validations: BulkImportValidationMessage[];
};

export type BulkImportParseResult = {
  rows: BulkImportParsedRow[];
  errors: string[];
  unknownHeaders: string[];
};

type CsvRow = {
  rowNumber: number;
  values: string[];
};

const headerAliases: Record<string, BulkImportHeader> = {
  brand: "name",
  model: "modelNumber",
  model_number: "modelNumber",
  mount: "mounts",
  mount_values: "mounts",
  release_date: "releaseDate",
  announced_date: "announcedDate",
  msrp: "msrpNowUsd",
  msrp_now_usd: "msrpNowUsd",
  msrp_at_launch_usd: "msrpAtLaunchUsd",
  weight: "weightGrams",
  weight_g: "weightGrams",
  image_circle: "imageCircleSize",
  has_autofocus: "hasAutofocus",
  has_stabilization: "hasStabilization",
  is_macro: "isMacro",
  front_filter_thread_size_mm: "frontFilterThreadSizeMm",
  has_weather_sealing: "hasWeatherSealing",
};

/** Former CSV columns; ignored so old templates do not warn. */
const IGNORED_BULK_IMPORT_HEADERS = new Set([
  "focallengthminmm",
  "focallengthmaxmm",
  "maxaperturewide",
  "maxaperturetele",
  "minaperturewide",
  "minaperturetele",
  "isprime",
  "focal_min",
  "focal_max",
  "focal_length_min_mm",
  "focal_length_max_mm",
  "max_aperture_wide",
  "max_aperture_tele",
  "min_aperture_wide",
  "min_aperture_tele",
  "is_prime",
  "linkmanufacturer",
  "linkmpb",
  "linkamazon",
  "manufacturer_url",
  "mpb_url",
  "amazon_url",
  "notes",
]);

const headerSet = new Set<string>(BULK_IMPORT_HEADERS);

function normalizeHeader(header: string): string {
  return header.trim().replace(/^\uFEFF/, "");
}

function headerLookupKey(header: string): string {
  return normalizeHeader(header)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isIgnoredBulkImportHeader(header: string): boolean {
  const trimmed = normalizeHeader(header);
  if (!trimmed) return false;
  return (
    IGNORED_BULK_IMPORT_HEADERS.has(trimmed.toLowerCase()) ||
    IGNORED_BULK_IMPORT_HEADERS.has(headerLookupKey(trimmed))
  );
}

function canonicalHeader(header: string): BulkImportHeader | null {
  const trimmed = normalizeHeader(header);
  if (headerSet.has(trimmed)) return trimmed as BulkImportHeader;
  const snake = headerLookupKey(trimmed);
  return headerAliases[snake] ?? null;
}

function parseCsvRows(input: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let field = "";
  let row: string[] = [];
  let rowNumber = 1;
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push({ rowNumber, values: row });
      row = [];
      field = "";
      rowNumber++;
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push({ rowNumber, values: row });
  }

  return rows.filter((candidate) =>
    candidate.values.some((value) => value.trim().length > 0),
  );
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const cleaned = value.replace(/[$,]/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseInteger(value: string | undefined): number | undefined {
  const parsed = parseNumber(value);
  return parsed === undefined ? undefined : Math.trunc(parsed);
}

function parseUsdCents(value: string | undefined): number | undefined {
  const parsed = parseNumber(value);
  return parsed === undefined ? undefined : Math.round(parsed * 100);
}

function parseBoolean(value: string | undefined): boolean | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;
  return undefined;
}

function parseList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function compactString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isValidDateLike(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

export function inferBrandFromName(
  name: string,
): { id: string; name: string } | null {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) return null;

  const matches = BRANDS.filter((brand) => {
    const brandName = brand.name.trim().toLowerCase();
    return (
      normalizedName === brandName ||
      normalizedName.startsWith(`${brandName} `) ||
      normalizedName.startsWith(`${brandName}-`)
    );
  }).sort((a, b) => b.name.length - a.name.length);

  const match = matches[0];
  return match ? { id: match.id, name: match.name } : null;
}

export function resolveMountValues(values: string[]): {
  mountIds: string[];
  mountValues: string[];
  errors: string[];
} {
  const mountByValue = new Map(
    MOUNTS.map((mount) => [mount.value.toLowerCase(), mount]),
  );
  const seenIds = new Set<string>();
  const mountIds: string[] = [];
  const mountValues: string[] = [];
  const errors: string[] = [];

  for (const value of values) {
    const mount = mountByValue.get(value.toLowerCase());
    if (!mount) {
      errors.push(`Unknown mount value "${value}". Use values like z-nikon.`);
      continue;
    }
    if (seenIds.has(mount.id)) continue;
    seenIds.add(mount.id);
    mountIds.push(mount.id);
    mountValues.push(mount.value);
  }

  return { mountIds, mountValues, errors };
}

export function parseFocalLengthFromName(
  name: string,
): { min: number; max: number; isPrime: boolean } | null {
  // Allow mount prefixes glued to the focal token (FD100mm, FE24-70mm).
  // Do not require a leading word boundary before the digits.
  const range = name.match(
    /(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*mm\b/i,
  );
  if (range?.[1] && range[2]) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return { min, max, isPrime: min === max };
    }
  }

  const prime = name.match(/(\d+(?:\.\d+)?)\s*mm\b/i);
  if (prime?.[1]) {
    const focal = Number(prime[1]);
    if (Number.isFinite(focal)) {
      return { min: focal, max: focal, isPrime: true };
    }
  }

  return null;
}

/**
 * Parse max aperture from a lens name.
 * Supports the common manufacturer conventions:
 * - f-stop: f/2.8, f2.8, F2.8, f 2.8, f/4.5-6.3 (also unicode ƒ)
 * - ratio: 1:2.8, 1:2.8-4
 * - cine T-stop: T2.9, T/2.9
 */
export function parseApertureFromName(
  name: string,
): { wide: number; tele?: number } | null {
  const normalized = name
    .replace(/\u0192/g, "f")
    .replace(/[—–]/g, "-");

  const patterns = [
    /\bf\s*\/?\s*(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/i,
    /\b1\s*:\s*(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/i,
    /\bt\s*\/?\s*(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const wideRaw = match?.[1];
    if (!wideRaw) continue;
    const wide = Number(wideRaw);
    const tele = match?.[2] ? Number(match[2]) : undefined;
    if (!Number.isFinite(wide)) continue;
    if (tele !== undefined && !Number.isFinite(tele)) continue;
    return tele === undefined ? { wide } : { wide, tele };
  }

  return null;
}

/**
 * Apply name-derived focal length and max aperture onto a lens object.
 * Always overwrites previous inferred values from the name.
 */
export function applyLensInferencesFromName(
  name: string,
  lens: BulkImportParsedRow["lens"] = {},
): {
  lens: BulkImportParsedRow["lens"];
  inferred: { focalLength: boolean; aperture: boolean };
} {
  const nextLens: BulkImportParsedRow["lens"] = { ...lens };
  delete nextLens.focalLengthMinMm;
  delete nextLens.focalLengthMaxMm;
  delete nextLens.isPrime;
  delete nextLens.maxApertureWide;
  delete nextLens.maxApertureTele;

  const inferredFocal = parseFocalLengthFromName(name);
  let focalLength = false;
  if (inferredFocal) {
    nextLens.focalLengthMinMm = inferredFocal.min;
    nextLens.focalLengthMaxMm = inferredFocal.max;
    nextLens.isPrime = inferredFocal.isPrime;
    focalLength = true;
  }

  const inferredAperture = parseApertureFromName(name);
  let aperture = false;
  if (inferredAperture) {
    nextLens.maxApertureWide = inferredAperture.wide;
    if (inferredAperture.tele !== undefined) {
      nextLens.maxApertureTele = inferredAperture.tele;
    }
    aperture = true;
  }

  return {
    lens: nextLens,
    inferred: { focalLength, aperture },
  };
}

function resolveSensorFormat(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  const match = SENSOR_FORMATS.find(
    (format) =>
      format.id.toLowerCase() === lower ||
      format.slug.toLowerCase() === lower ||
      format.name.toLowerCase() === lower,
  );
  return match?.id;
}

function countMappedValues(row: BulkImportParsedRow): number {
  return (
    Object.values(row.core).filter((value) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined,
    ).length +
    Object.values(row.lens).filter((value) => value !== undefined).length +
    row.mountIds.length
  );
}

export function getMappedValueCount(row: BulkImportParsedRow): number {
  return countMappedValues(row);
}

export function parseGearBulkImportCsv(input: string): BulkImportParseResult {
  const csvRows = parseCsvRows(input);
  if (csvRows.length === 0) {
    return { rows: [], errors: ["CSV is empty."], unknownHeaders: [] };
  }

  const headerValues = csvRows[0]?.values ?? [];
  const headers = headerValues.map(canonicalHeader);
  const unknownHeaders = headerValues
    .map(normalizeHeader)
    .filter(
      (header, index) =>
        header.length > 0 && !headers[index] && !isIgnoredBulkImportHeader(header),
    );

  if (!headers.includes("name")) {
    return {
      rows: [],
      errors: ['CSV must include a "name" column.'],
      unknownHeaders,
    };
  }

  const parsedRows = csvRows.slice(1).map((csvRow): BulkImportParsedRow => {
    const raw: Partial<Record<BulkImportHeader, string>> = {};
    csvRow.values.forEach((value, index) => {
      const header = headers[index];
      if (header) raw[header] = value.trim();
    });

    const validations: BulkImportValidationMessage[] = [];
    const name = compactString(raw.name) ?? "";
    const brand = inferBrandFromName(name);
    if (!name) {
      validations.push({ level: "error", message: "Name is required." });
    }
    if (!brand) {
      validations.push({
        level: "error",
        message: "Name must start with a known brand name.",
      });
    }

    const mountResolution = resolveMountValues(parseList(raw.mounts));
    for (const message of mountResolution.errors) {
      validations.push({ level: "error", message });
    }

    const core: BulkImportParsedRow["core"] = {};
    for (const field of ["announcedDate", "releaseDate"] as const) {
      const value = compactString(raw[field]);
      if (!value) continue;
      if (isValidDateLike(value)) {
        core[field] = value;
      } else {
        validations.push({
          level: "error",
          message: `${field} must be a parseable date.`,
        });
      }
    }

    const msrpNowUsdCents = parseUsdCents(raw.msrpNowUsd);
    if (msrpNowUsdCents !== undefined) core.msrpNowUsdCents = msrpNowUsdCents;
    const msrpAtLaunchUsdCents = parseUsdCents(raw.msrpAtLaunchUsd);
    if (msrpAtLaunchUsdCents !== undefined) {
      core.msrpAtLaunchUsdCents = msrpAtLaunchUsdCents;
    }
    const weightGrams = parseInteger(raw.weightGrams);
    if (weightGrams !== undefined) core.weightGrams = weightGrams;

    const lens: BulkImportParsedRow["lens"] = {};
    const imageCircleSizeId = resolveSensorFormat(raw.imageCircleSize);
    if (raw.imageCircleSize?.trim() && !imageCircleSizeId) {
      validations.push({
        level: "error",
        message: `Unknown imageCircleSize "${raw.imageCircleSize}". Use a sensor format slug, id, or name.`,
      });
    } else if (imageCircleSizeId) {
      lens.imageCircleSizeId = imageCircleSizeId;
    }

    const hasAutofocus = parseBoolean(raw.hasAutofocus);
    if (hasAutofocus !== undefined) lens.hasAutofocus = hasAutofocus;
    const hasStabilization = parseBoolean(raw.hasStabilization);
    if (hasStabilization !== undefined) {
      lens.hasStabilization = hasStabilization;
    }
    const isMacro = parseBoolean(raw.isMacro);
    if (isMacro !== undefined) lens.isMacro = isMacro;
    const frontFilterThreadSizeMm = parseInteger(raw.frontFilterThreadSizeMm);
    if (frontFilterThreadSizeMm !== undefined) {
      lens.frontFilterThreadSizeMm = frontFilterThreadSizeMm;
    }
    const hasWeatherSealing = parseBoolean(raw.hasWeatherSealing);
    if (hasWeatherSealing !== undefined) {
      lens.hasWeatherSealing = hasWeatherSealing;
    }

    const { lens: lensWithInferences, inferred } = applyLensInferencesFromName(
      name,
      lens,
    );

    return {
      rowNumber: csvRow.rowNumber,
      raw,
      name,
      modelNumber: compactString(raw.modelNumber),
      brandId: brand?.id,
      brandName: brand?.name,
      mountIds: mountResolution.mountIds,
      mountValues: mountResolution.mountValues,
      core,
      lens: lensWithInferences,
      inferred,
      validations,
    };
  });

  return { rows: parsedRows, errors: [], unknownHeaders };
}

export function buildBulkImportValidationReport(
  rows: Array<
    Pick<
      BulkImportParsedRow,
      "rowNumber" | "name" | "brandName" | "mountValues" | "validations"
    > & {
      duplicateMessages?: BulkImportValidationMessage[];
    }
  >,
): string {
  const lines: string[] = [];
  for (const row of rows) {
    const messages = [...row.validations, ...(row.duplicateMessages ?? [])];
    if (messages.length === 0) continue;
    lines.push(`Row ${row.rowNumber}: ${row.name || "(missing name)"}`);
    lines.push(`Brand: ${row.brandName ?? "(unresolved)"}`);
    lines.push(
      `Mounts: ${row.mountValues.length > 0 ? row.mountValues.join("|") : "(none)"}`,
    );
    for (const message of messages) {
      lines.push(`- ${message.level.toUpperCase()}: ${message.message}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function buildBulkImportAiFixPrompt(params: {
  csvText: string;
  validationReport: string;
  fieldGuide: string;
}): string {
  const report = params.validationReport.trim();
  return [
    "You are fixing a CSV for Sharply's /admin/gear bulk importer.",
    "",
    "Task:",
    "- Return only corrected CSV text.",
    "- Keep the same header row unless a header is clearly misspelled.",
    "- Fix only rows with validation errors or warnings listed below.",
    "- Preserve valid rows and all known-good values.",
    "- Use mount values like z-nikon or e-sony in the mounts column.",
    "- Use imageCircleSize slugs such as full-frame, aps-c, or micro-4-3.",
    "- Do not include focal length, aperture, isPrime, link, or notes columns; focal length and max aperture are inferred from the name.",
    "",
    "Importer field guide:",
    params.fieldGuide.trim(),
    "",
    "Validation issues to fix:",
    report || "No validation issues were reported.",
    "",
    "Current CSV:",
    "```csv",
    params.csvText.trim(),
    "```",
  ].join("\n");
}

export const BULK_IMPORT_TEMPLATE_CSV = `${BULK_IMPORT_HEADERS.join(",")}
Nikon Nikkor Z 24-70mm f/2.8 S,NIKKOR-Z-24-70-28,z-nikon,2019-02-14,2019-02-14,2299.95,2299.95,805,full-frame,true,false,false,82,true`;

export const BULK_IMPORT_FIELD_GUIDE = [
  "name: Required. Must start with a known brand name. Focal length, prime/zoom, and max aperture are inferred from names. Aperture forms: f/2.8 or F2.8, 1:2.8, and cine T2.9 / T/2.9 (ranges like f/4.5-6.3 and 1:2.8-4 included).",
  "modelNumber: Optional unique manufacturer model code.",
  "mounts: Optional mount.value list separated by | or ;. Example: z-nikon|e-sony.",
  "releaseDate, announcedDate: Optional parseable dates, preferably YYYY-MM-DD.",
  "msrpNowUsd, msrpAtLaunchUsd: Optional decimal USD amounts like 1299.95; importer stores cents.",
  "weightGrams: Optional integer grams like 805.",
  "hasAutofocus, hasStabilization, isMacro, hasWeatherSealing: true/false, yes/no, or 1/0.",
  "imageCircleSize: Optional sensor format slug, id, or name. Prefer these slugs when mapping coverage: micro-4-3, aps-c, full-frame, medium-format-45x30, medium-format-55x40, medium-format-44x33, cinema-large-format.",
  "frontFilterThreadSizeMm: Optional integer millimeters like 67, 77, 82.",
].join("\n");
