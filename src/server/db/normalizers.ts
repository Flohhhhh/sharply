import { SENSOR_FORMATS, ENUMS } from "~/lib/constants";
import { z } from "zod";

type ProposalPayloadSection = Record<string, unknown>;
type ProposalPayload = {
  core?: ProposalPayloadSection;
  camera?: ProposalPayloadSection;
  lens?: ProposalPayloadSection;
  cameraCardSlots?: unknown;
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
      widthMm: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      heightMm: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      depthMm: z
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
      // enum-backed string with membership check
      sensorStackingType: z
        .preprocess((value) => {
          if (typeof value !== "string") return undefined;
          const allowed = ENUMS.sensor_stacking_types_enum as readonly string[];
          return allowed.includes(value) ? value : undefined;
        }, z.string().optional())
        .optional(),
      sensorTechType: z
        .preprocess((value) => {
          if (typeof value !== "string") return undefined;
          const allowed = ENUMS.sensor_tech_types_enum as readonly string[];
          return allowed.includes(value) ? value : undefined;
        }, z.string().optional())
        .optional(),
      isBackSideIlluminated: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      sensorReadoutSpeedMs: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      maxRawBitDepth: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      hasIbis: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      hasElectronicVibrationReduction: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      cipaStabilizationRatingStops: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().optional())
        .optional(),
      hasPixelShiftShooting: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      hasAntiAliasingFilter: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),

      processorName: z.string().optional(),
      hasWeatherSealing: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      focusPoints: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      afAreaModes: z.array(z.string().uuid()).optional(),
      hasFocusPeaking: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      hasFocusBracketing: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      shutterSpeedMax: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      shutterSpeedMin: z
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
      flashSyncSpeed: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      hasSilentShootingAvailable: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      availableShutterTypes: z.array(z.string()).optional(),
      cipaBatteryShotsPerCharge: z
        .preprocess((value) => {
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().optional())
        .optional(),
      supportedBatteries: z.array(z.string()).optional(),
      usbCharging: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      usbPowerDelivery: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      hasLogColorProfile: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      has10BitVideo: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      has12BitVideo: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      hasIntervalometer: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      hasSelfTimer: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      hasBuiltInFlash: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
      hasHotShoe: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
    })
    .catchall(z.unknown());

  const LensSchema = z
    .object({
      isPrime: z
        .preprocess(
          (value) => coerceBoolean(value) ?? undefined,
          z.boolean().optional(),
        )
        .optional(),
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

  const CardSlotsSchema = z
    .array(
      z
        .object({
          slotIndex: z
            .preprocess((value) => {
              const num = coerceNumber(value);
              return num === null ? undefined : Math.trunc(num);
            }, z.number().int().positive())
            .optional(),
          supportedFormFactors: z
            .array(
              z.preprocess((value) => {
                if (typeof value !== "string") return undefined;
                const allowed =
                  ENUMS.card_form_factor_enum as readonly string[];
                return allowed.includes(value) ? value : undefined;
              }, z.string()),
            )
            .optional(),
          supportedBuses: z
            .array(
              z.preprocess((value) => {
                if (typeof value !== "string") return undefined;
                const allowed = ENUMS.card_bus_enum as readonly string[];
                return allowed.includes(value) ? value : undefined;
              }, z.string()),
            )
            .optional(),
          supportedSpeedClasses: z
            .array(
              z.preprocess((value) => {
                if (typeof value !== "string") return undefined;
                const allowed =
                  ENUMS.card_speed_class_enum as readonly string[];
                return allowed.includes(value) ? value : undefined;
              }, z.string()),
            )
            .optional(),
        })
        .catchall(z.unknown()),
    )
    .optional();

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

  if (payload.cameraCardSlots) {
    const parsed = CardSlotsSchema.parse(payload.cameraCardSlots);
    const list = Array.isArray(parsed) ? parsed : [];
    const cleaned = list
      .map((s) => ({
        slotIndex:
          typeof s?.slotIndex === "number" && s.slotIndex > 0
            ? Math.trunc(s.slotIndex)
            : undefined,
        supportedFormFactors: Array.isArray(s?.supportedFormFactors)
          ? s.supportedFormFactors
          : undefined,
        supportedBuses: Array.isArray(s?.supportedBuses)
          ? s.supportedBuses
          : undefined,
        supportedSpeedClasses: Array.isArray(s?.supportedSpeedClasses)
          ? s.supportedSpeedClasses
          : undefined,
      }))
      .filter((s) => typeof s.slotIndex === "number");
    // enforce a max of 2 slots
    const capped = cleaned
      .sort((a, b) => a.slotIndex! - b.slotIndex!)
      .slice(0, 2)
      .map((s, i) => ({ ...s, slotIndex: i + 1 }));
    if (capped.length) normalized.cameraCardSlots = capped as unknown[];
  }

  return normalized;
}
