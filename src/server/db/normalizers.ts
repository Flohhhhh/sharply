import { SENSOR_FORMATS, ENUMS } from "~/lib/constants";
import { z } from "zod";

type ProposalPayloadSection = Record<string, unknown>;
type ProposalPayload = {
  core?: ProposalPayloadSection;
  camera?: ProposalPayloadSection;
  lens?: ProposalPayloadSection;
  cameraCardSlots?: unknown;
  fixedLens?: ProposalPayloadSection;
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
      announcedDate: z
        .preprocess((value) => {
          if (value === null) return null; // allow explicit clearing
          if (value instanceof Date) return value;
          if (typeof value === "string")
            return parseDateUTC(value) ?? undefined;
          return undefined;
        }, z.date().nullable().optional())
        .optional(),
      announcedDatePrecision: z
        .preprocess((value) => {
          if (value === null) return null;
          if (typeof value !== "string") return undefined;
          const v = value.toUpperCase();
          const allowed =
            ((ENUMS as any).date_precision_enum as readonly string[]) ??
            (["YEAR", "MONTH", "DAY"] as const);
          return allowed.includes(v) ? v : undefined;
        }, z.string().nullable().optional())
        .optional(),
      releaseDate: z
        .preprocess((value) => {
          if (value === null) return null; // allow explicit clearing
          if (value instanceof Date) return value;
          if (typeof value === "string")
            return parseDateUTC(value) ?? undefined;
          return undefined;
        }, z.date().nullable().optional())
        .optional(),
      releaseDatePrecision: z
        .preprocess((value) => {
          if (value === null) return null;
          if (typeof value !== "string") return undefined;
          const v = value.toUpperCase();
          const allowed =
            ((ENUMS as any).date_precision_enum as readonly string[]) ??
            (["YEAR", "MONTH", "DAY"] as const);
          return allowed.includes(v) ? v : undefined;
        }, z.string().nullable().optional())
        .optional(),
      // Mount support: single mountId for cameras, array mountIds for lenses
      mountId: z
        .preprocess((value) => {
          if (value === null) return null;
          if (typeof value === "string" && isUuid(value)) return value;
          return undefined;
        }, z.string().uuid().nullable().optional())
        .optional(),
      mountIds: z
        .preprocess((value) => {
          if (value === null) return null;
          if (Array.isArray(value)) {
            const filtered = value.filter(
              (id) => typeof id === "string" && isUuid(id),
            );
            return filtered.length > 0 ? filtered : undefined;
          }
          // Legacy: single mountId converted to array
          if (typeof value === "string" && isUuid(value)) return [value];
          return undefined;
        }, z.array(z.string().uuid()).nullable().optional())
        .optional(),
      // Normalize current MSRP in cents
      msrpNowUsdCents: z
        .preprocess((value) => {
          if (value === null) return null; // explicit clear
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      // Normalize launch MSRP in cents
      msrpAtLaunchUsdCents: z
        .preprocess((value) => {
          if (value === null) return null; // explicit clear
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      // Normalize MPB max price in cents
      mpbMaxPriceUsdCents: z
        .preprocess((value) => {
          if (value === null) return null; // explicit clear
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      // Back-compat: legacy single MSRP field (maps to msrpNow on approve)
      msrpUsdCents: z
        .preprocess((value) => {
          if (value === null) return null; // explicit clear
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      weightGrams: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      widthMm: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : num;
        }, z.number().nullable().optional())
        .optional(),
      heightMm: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : num;
        }, z.number().nullable().optional())
        .optional(),
      depthMm: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : num;
        }, z.number().nullable().optional())
        .optional(),
    })
    .catchall(z.unknown());

  const CameraSchema = z
    .object({
      sensorFormatId: z
        .preprocess((value) => {
          if (value === null) return null; // explicit clear
          if (typeof value !== "string") return undefined;
          if (isUuid(value)) return value;
          const match = SENSOR_FORMATS.find((f) =>
            typeof f === "object" && f !== null
              ? (f as { slug?: string; id?: string }).slug === value ||
                (f as { slug?: string; id?: string }).id === value
              : false,
          ) as { id?: string } | undefined;
          return match?.id ?? undefined;
        }, z.string().uuid().nullable().optional())
        .optional(),
      resolutionMp: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : num;
        }, z.number().nullable().optional())
        .optional(),
      isoMin: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      isoMax: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      // enum-backed string with membership check
      sensorStackingType: z
        .preprocess((value) => {
          if (value === null) return null;
          if (typeof value !== "string") return undefined;
          const allowed = ENUMS.sensor_stacking_types_enum as readonly string[];
          return allowed.includes(value) ? value : undefined;
        }, z.string().nullable().optional())
        .optional(),
      sensorTechType: z
        .preprocess((value) => {
          if (value === null) return null;
          if (typeof value !== "string") return undefined;
          const allowed = ENUMS.sensor_tech_types_enum as readonly string[];
          return allowed.includes(value) ? value : undefined;
        }, z.string().nullable().optional())
        .optional(),
      isBackSideIlluminated: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      sensorReadoutSpeedMs: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          // Allow up to 1 decimal place
          return num === null ? undefined : Math.round(num * 10) / 10;
        }, z.number().nullable().optional())
        .optional(),
      maxRawBitDepth: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      hasIbis: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasElectronicVibrationReduction: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      cipaStabilizationRatingStops: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.round(num * 10) / 10;
        }, z.number().nullable().optional())
        .optional(),
      hasPixelShiftShooting: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasAntiAliasingFilter: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),

      processorName: z
        .preprocess(
          (value) =>
            value === null
              ? null
              : typeof value === "string"
                ? value
                : undefined,
          z.string().nullable().optional(),
        )
        .optional(),
      hasWeatherSealing: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      focusPoints: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      afAreaModes: z.array(z.string().uuid()).optional(),
      hasFocusPeaking: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasFocusBracketing: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      shutterSpeedMax: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      shutterSpeedMin: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      maxFpsRaw: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.round(num * 10) / 10;
        }, z.number().nullable().optional())
        .optional(),
      maxFpsJpg: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.round(num * 10) / 10;
        }, z.number().nullable().optional())
        .optional(),
      flashSyncSpeed: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      hasSilentShootingAvailable: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      availableShutterTypes: z.array(z.string()).optional(),
      cipaBatteryShotsPerCharge: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      supportedBatteries: z.array(z.string()).optional(),
      usbCharging: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      usbPowerDelivery: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasLogColorProfile: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      has10BitVideo: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      has12BitVideo: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasIntervalometer: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasSelfTimer: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasBuiltInFlash: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasHotShoe: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
    })
    .catchall(z.unknown());

  const LensSchema = z
    .object({
      isPrime: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      focalLengthMinMm: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      focalLengthMaxMm: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      // Aperture fields (decimals allowed)
      maxApertureWide: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : num;
        }, z.number().nullable().optional())
        .optional(),
      maxApertureTele: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : num;
        }, z.number().nullable().optional())
        .optional(),
      minApertureWide: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : num;
        }, z.number().nullable().optional())
        .optional(),
      minApertureTele: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : num;
        }, z.number().nullable().optional())
        .optional(),
      hasStabilization: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      cipaStabilizationRatingStops: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          // Round to 1 decimal place
          return num === null ? undefined : Math.round(num * 10) / 10;
        }, z.number().nullable().optional())
        .optional(),
      hasStabilizationSwitch: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasAutofocus: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      isMacro: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      magnification: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          // Preserve up to 2 decimal places as per schema decimal(4,2)
          return num === null ? undefined : Math.round(num * 100) / 100;
        }, z.number().nullable().optional())
        .optional(),
      minimumFocusDistanceMm: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().nullable().optional())
        .optional(),
      hasFocusRing: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      focusMotorType: z
        .preprocess(
          (value) =>
            value === null
              ? null
              : typeof value === "string"
                ? value
                : undefined,
          z.string().nullable().optional(),
        )
        .optional(),
      hasAfMfSwitch: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasFocusLimiter: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasFocusRecallButton: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      numberElements: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      numberElementGroups: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      hasDiffractiveOptics: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      numberDiaphragmBlades: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      hasRoundedDiaphragmBlades: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasInternalZoom: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasInternalFocus: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      frontElementRotates: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      mountMaterial: z
        .preprocess((value) => {
          if (value === null) return null;
          if (typeof value !== "string") return undefined;
          const allowed = ENUMS.mount_material_enum as readonly string[];
          return allowed.includes(value) ? value : undefined;
        }, z.string().nullable().optional())
        .optional(),
      hasWeatherSealing: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasApertureRing: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      numberCustomControlRings: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      numberFunctionButtons: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      acceptsFilterTypes: z.array(z.string()).optional(),
      frontFilterThreadSizeMm: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      rearFilterThreadSizeMm: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      dropInFilterSizeMm: z
        .preprocess((value) => {
          if (value === null) return null;
          const num = coerceNumber(value);
          return num === null ? undefined : Math.trunc(num);
        }, z.number().int().nullable().optional())
        .optional(),
      hasBuiltInTeleconverter: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasLensHood: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
      hasTripodCollar: z
        .preprocess(
          (value) =>
            value === null ? null : (coerceBoolean(value) ?? undefined),
          z.boolean().nullable().optional(),
        )
        .optional(),
    })
    .catchall(z.unknown())
    .transform((lens) => {
      // Validate invariants without coercive adjustments. Leave values as-is so UI can guide user.
      // We only ensure type coercion above; here we avoid mutating to keep nullability semantics.
      return lens as Record<string, unknown>;
    });

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

  // Fixed-lens (subset of lens fields)
  if (payload.fixedLens) {
    const FixedLensSchema = z
      .object({
        isPrime: z
          .preprocess(
            (value) =>
              value === null ? null : (coerceBoolean(value) ?? undefined),
            z.boolean().nullable().optional(),
          )
          .optional(),
        focalLengthMinMm: z
          .preprocess((value) => {
            if (value === null) return null;
            const num = coerceNumber(value);
            return num === null ? undefined : Math.trunc(num);
          }, z.number().int().nullable().optional())
          .optional(),
        focalLengthMaxMm: z
          .preprocess((value) => {
            if (value === null) return null;
            const num = coerceNumber(value);
            return num === null ? undefined : Math.trunc(num);
          }, z.number().int().nullable().optional())
          .optional(),
        maxApertureWide: z
          .preprocess((value) => {
            if (value === null) return null;
            const num = coerceNumber(value);
            return num === null ? undefined : num;
          }, z.number().nullable().optional())
          .optional(),
        maxApertureTele: z
          .preprocess((value) => {
            if (value === null) return null;
            const num = coerceNumber(value);
            return num === null ? undefined : num;
          }, z.number().nullable().optional())
          .optional(),
        minApertureWide: z
          .preprocess((value) => {
            if (value === null) return null;
            const num = coerceNumber(value);
            return num === null ? undefined : num;
          }, z.number().nullable().optional())
          .optional(),
        minApertureTele: z
          .preprocess((value) => {
            if (value === null) return null;
            const num = coerceNumber(value);
            return num === null ? undefined : num;
          }, z.number().nullable().optional())
          .optional(),
        hasAutofocus: z
          .preprocess(
            (value) =>
              value === null ? null : (coerceBoolean(value) ?? undefined),
            z.boolean().nullable().optional(),
          )
          .optional(),
        minimumFocusDistanceMm: z
          .preprocess((value) => {
            if (value === null) return null;
            const num = coerceNumber(value);
            return num === null ? undefined : Math.trunc(num);
          }, z.number().nullable().optional())
          .optional(),
        frontElementRotates: z
          .preprocess(
            (value) =>
              value === null ? null : (coerceBoolean(value) ?? undefined),
            z.boolean().nullable().optional(),
          )
          .optional(),
        frontFilterThreadSizeMm: z
          .preprocess((value) => {
            if (value === null) return null;
            const num = coerceNumber(value);
            return num === null ? undefined : Math.trunc(num);
          }, z.number().int().nullable().optional())
          .optional(),
        hasLensHood: z
          .preprocess(
            (value) =>
              value === null ? null : (coerceBoolean(value) ?? undefined),
            z.boolean().nullable().optional(),
          )
          .optional(),
      })
      .catchall(z.unknown());

    const parsed = FixedLensSchema.parse(payload.fixedLens);
    const pruned = pruneUndefined(parsed as Record<string, unknown>);
    if (Object.keys(pruned).length) (normalized as any).fixedLens = pruned;
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
