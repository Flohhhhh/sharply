import { SENSOR_FORMATS } from "~/lib/constants";
import { z } from "zod";

type ProposalPayloadSection = Record<string, unknown>;
type ProposalPayload = {
  core?: ProposalPayloadSection;
  camera?: ProposalPayloadSection;
  lens?: ProposalPayloadSection;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function parseDateUTC(value: string): Date | null {
  // Accept ISO strings, or YYYY-MM-DD and coerce to UTC midnight
  if (!value) return null;
  if (/[tT]/.test(value)) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function coerceNumber(n: unknown): number | null {
  if (n === null || n === undefined || n === "") return null;
  const num = typeof n === "number" ? n : Number(n);
  return Number.isFinite(num) ? num : null;
}

function coerceBoolean(b: unknown): boolean | null {
  if (b === null || b === undefined) return null;
  if (typeof b === "boolean") return b;
  if (b === "true") return true;
  if (b === "false") return false;
  return null;
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): T {
  const entries = Object.entries(obj).filter(
    ([, value]) => value !== undefined,
  );
  return Object.fromEntries(entries) as T;
}

export function normalizeProposalPayloadForDb(
  payload: ProposalPayload,
): ProposalPayload {
  const CoreSchema = z
    .object({
      releaseDate: z
        .preprocess((value) => {
          if (value instanceof Date) return value;
          if (typeof value === "string")
            return parseDateUTC(value) ?? undefined;
          return undefined;
        }, z.date().optional())
        .optional(),
      msrpUsdCents: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      weightGrams: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
    })
    .catchall(z.unknown());

  const CameraSchema = z
    .object({
      sensorFormatId: z
        .preprocess((value) => {
          if (typeof value !== "string") return undefined;
          if (isUuid(value)) return value;
          const match = SENSOR_FORMATS.find((f) =>
            typeof f === "object" && f !== null
              ? (f as { slug?: string; id?: string }).slug === value ||
                (f as { slug?: string; id?: string }).id === value
              : false,
          ) as { id?: string } | undefined;
          return match?.id ?? undefined;
        }, z.string().uuid().optional())
        .optional(),
      resolutionMp: z
        .preprocess(
          (value) => coerceNumber(value) ?? undefined,
          z.number().optional(),
        )
        .optional(),
      isoMin: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      isoMax: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      maxFpsRaw: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      maxFpsJpg: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
    })
    .catchall(z.unknown());

  const LensSchema = z
    .object({
      focalLengthMinMm: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      focalLengthMaxMm: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      hasStabilization: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
    })
    .catchall(z.unknown());

  const normalized: ProposalPayload = {};

  if (payload.core) {
    const parsed = CoreSchema.parse(payload.core);
    const pruned = pruneUndefined(parsed as Record<string, unknown>);
    if (Object.keys(pruned).length) normalized.core = pruned;
  }

  if (payload.camera) {
    const parsed = CameraSchema.parse(payload.camera);
    const pruned = pruneUndefined(parsed as Record<string, unknown>);
    if (Object.keys(pruned).length) normalized.camera = pruned;
  }

  if (payload.lens) {
    const parsed = LensSchema.parse(payload.lens);
    const pruned = pruneUndefined(parsed as Record<string, unknown>);
    if (Object.keys(pruned).length) normalized.lens = pruned;
  }

  return normalized;
}
