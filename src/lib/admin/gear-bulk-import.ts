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
  "linkManufacturer",
  "linkMpb",
  "linkAmazon",
  "focalLengthMinMm",
  "focalLengthMaxMm",
  "maxApertureWide",
  "maxApertureTele",
  "minApertureWide",
  "minApertureTele",
  "isPrime",
  "imageCircleSize",
  "hasAutofocus",
  "hasStabilization",
  "isMacro",
  "frontFilterThreadSizeMm",
  "hasWeatherSealing",
  "notes",
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
    linkManufacturer?: string;
    linkMpb?: string;
    linkAmazon?: string;
    notes?: string[];
  };
  lens: {
    isPrime?: boolean;
    focalLengthMinMm?: number;
    focalLengthMaxMm?: number;
    imageCircleSizeId?: string;
    maxApertureWide?: number;
    maxApertureTele?: number;
    minApertureWide?: number;
    minApertureTele?: number;
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
  manufacturer_url: "linkManufacturer",
  mpb_url: "linkMpb",
  amazon_url: "linkAmazon",
  focal_min: "focalLengthMinMm",
  focal_max: "focalLengthMaxMm",
  focal_length_min_mm: "focalLengthMinMm",
  focal_length_max_mm: "focalLengthMaxMm",
  max_aperture_wide: "maxApertureWide",
  max_aperture_tele: "maxApertureTele",
  min_aperture_wide: "minApertureWide",
  min_aperture_tele: "minApertureTele",
  is_prime: "isPrime",
  image_circle: "imageCircleSize",
  has_autofocus: "hasAutofocus",
  has_stabilization: "hasStabilization",
  is_macro: "isMacro",
  front_filter_thread_size_mm: "frontFilterThreadSizeMm",
  has_weather_sealing: "hasWeatherSealing",
};

const headerSet = new Set<string>(BULK_IMPORT_HEADERS);

function normalizeHeader(header: string): string {
  return header.trim().replace(/^\uFEFF/, "");
}

function canonicalHeader(header: string): BulkImportHeader | null {
  const trimmed = normalizeHeader(header);
  if (headerSet.has(trimmed)) return trimmed as BulkImportHeader;
  const snake = trimmed
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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
  const range = name.match(
    /\b(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*mm\b/i,
  );
  if (range?.[1] && range[2]) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return { min, max, isPrime: min === max };
    }
  }

  const prime = name.match(/\b(\d+(?:\.\d+)?)\s*mm\b/i);
  if (prime?.[1]) {
    const focal = Number(prime[1]);
    if (Number.isFinite(focal)) {
      return { min: focal, max: focal, isPrime: true };
    }
  }

  return null;
}

export function parseApertureFromName(
  name: string,
): { wide: number; tele?: number } | null {
  const normalized = name.replace(/\u0192/g, "f");
  const match =
    normalized.match(
      /\bf\s*\/?\s*(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?/i,
    ) ??
    normalized.match(/\b1:\s*(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?/i);

  const wideRaw = match?.[1];
  if (!wideRaw) return null;
  const wide = Number(wideRaw);
  const tele = match?.[2] ? Number(match[2]) : undefined;
  if (!Number.isFinite(wide)) return null;
  if (tele !== undefined && !Number.isFinite(tele)) return null;
  return tele === undefined ? { wide } : { wide, tele };
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
    .filter((header, index) => header.length > 0 && !headers[index]);

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
    const linkManufacturer = compactString(raw.linkManufacturer);
    if (linkManufacturer) core.linkManufacturer = linkManufacturer;
    const linkMpb = compactString(raw.linkMpb);
    if (linkMpb) core.linkMpb = linkMpb;
    const linkAmazon = compactString(raw.linkAmazon);
    if (linkAmazon) core.linkAmazon = linkAmazon;
    const notes = parseList(raw.notes);
    if (notes.length > 0) core.notes = notes;

    const lens: BulkImportParsedRow["lens"] = {};
    const inferredFocal = parseFocalLengthFromName(name);
    const focalMin = parseNumber(raw.focalLengthMinMm);
    const focalMax = parseNumber(raw.focalLengthMaxMm);
    let inferredFocalApplied = false;
    if (focalMin !== undefined) lens.focalLengthMinMm = focalMin;
    if (focalMax !== undefined) lens.focalLengthMaxMm = focalMax;
    if (
      inferredFocal &&
      lens.focalLengthMinMm === undefined &&
      lens.focalLengthMaxMm === undefined
    ) {
      lens.focalLengthMinMm = inferredFocal.min;
      lens.focalLengthMaxMm = inferredFocal.max;
      lens.isPrime = inferredFocal.isPrime;
      inferredFocalApplied = true;
    }

    const isPrime = parseBoolean(raw.isPrime);
    if (isPrime !== undefined) lens.isPrime = isPrime;

    const inferredAperture = parseApertureFromName(name);
    const maxApertureWide = parseNumber(raw.maxApertureWide);
    const maxApertureTele = parseNumber(raw.maxApertureTele);
    let inferredApertureApplied = false;
    if (maxApertureWide !== undefined) lens.maxApertureWide = maxApertureWide;
    if (maxApertureTele !== undefined) lens.maxApertureTele = maxApertureTele;
    if (
      inferredAperture &&
      lens.maxApertureWide === undefined &&
      lens.maxApertureTele === undefined
    ) {
      lens.maxApertureWide = inferredAperture.wide;
      if (inferredAperture.tele !== undefined) {
        lens.maxApertureTele = inferredAperture.tele;
      }
      inferredApertureApplied = true;
    }

    const minApertureWide = parseNumber(raw.minApertureWide);
    if (minApertureWide !== undefined) lens.minApertureWide = minApertureWide;
    const minApertureTele = parseNumber(raw.minApertureTele);
    if (minApertureTele !== undefined) lens.minApertureTele = minApertureTele;
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
      lens,
      inferred: {
        focalLength: inferredFocalApplied,
        aperture: inferredApertureApplied,
      },
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
    "- Use numeric spec values: aperture floats without f/ and focal lengths in millimeters.",
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
Nikon Nikkor Z 24-70mm f/2.8 S,NIKKOR-Z-24-70-28,z-nikon,2019-02-14,2019-02-14,2299.95,2299.95,805,https://www.nikonusa.com/,,https://www.amazon.com/,24,70,2.8,,22,,false,full-frame,true,false,false,82,true,Professional standard zoom`;

export const BULK_IMPORT_FIELD_GUIDE = [
  "name: Required. Must start with a known brand name. Lens focal length/aperture can be inferred from names like 60mm f/2.8.",
  "modelNumber: Optional unique manufacturer model code.",
  "mounts: Optional mount.value list separated by | or ;. Example: z-nikon|e-sony.",
  "releaseDate, announcedDate: Optional parseable dates, preferably YYYY-MM-DD.",
  "msrpNowUsd, msrpAtLaunchUsd: Optional decimal USD amounts like 1299.95; importer stores cents.",
  "weightGrams: Optional integer grams like 805.",
  "linkManufacturer, linkMpb, linkAmazon: Optional URLs.",
  "focalLengthMinMm, focalLengthMaxMm: Optional numeric millimeter values. Use integers or decimals like 24, 70, 14.5. Blank cells are inferred from name when possible.",
  "maxApertureWide, maxApertureTele: Optional aperture floats without f/ prefix, e.g. 1.8, 2.8, 4.5, 6.3. Blank cells are inferred from name when possible.",
  "minApertureWide, minApertureTele: Optional aperture floats without f/ prefix, e.g. 16, 22, 32.",
  "isPrime, hasAutofocus, hasStabilization, isMacro, hasWeatherSealing: true/false, yes/no, or 1/0.",
  "imageCircleSize: Optional sensor format slug, id, or name. Prefer these slugs when mapping coverage: micro-4-3, aps-c, full-frame, medium-format-45x30, medium-format-55x40, medium-format-44x33, cinema-large-format.",
  "frontFilterThreadSizeMm: Optional integer millimeters like 67, 77, 82.",
  "notes: Optional notes separated by | or ;.",
].join("\n");
