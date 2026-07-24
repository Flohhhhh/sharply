import {
  parseApertureFromName,
  parseFocalLengthFromName,
} from "~/lib/admin/gear-bulk-import";

export type LensOpticsCurrent = {
  focalLengthMinMm: number | null;
  focalLengthMaxMm: number | null;
  isPrime: boolean | null;
  maxApertureWide: number | null;
  maxApertureTele: number | null;
};

export type LensOpticsProposed = {
  focalLengthMinMm?: number;
  focalLengthMaxMm?: number;
  isPrime?: boolean;
  maxApertureWide?: number;
  maxApertureTele?: number;
};

export type LensOpticsBackfillProposal = {
  current: LensOpticsCurrent;
  proposed: LensOpticsProposed;
  /** Resulting values after applying proposed fills onto current. */
  after: LensOpticsCurrent;
  fills: Array<
    | "focalLength"
    | "isPrime"
    | "maxApertureWide"
    | "maxApertureTele"
  >;
  missing: Array<
    | "focalLength"
    | "isPrime"
    | "maxApertureWide"
  >;
  actionable: boolean;
};

function isMissingNumber(value: number | null | undefined): boolean {
  return value == null || !Number.isFinite(Number(value));
}

function toNumberOrNull(value: number | null | undefined): number | null {
  if (value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

/**
 * High-confidence optics backfill from a lens name.
 * Only proposes fills for missing fields; never overwrites existing values.
 */
export function proposeLensOpticsBackfillFromName(
  name: string,
  current: LensOpticsCurrent,
): LensOpticsBackfillProposal {
  const focalMin = toNumberOrNull(current.focalLengthMinMm);
  const focalMax = toNumberOrNull(current.focalLengthMaxMm);
  const maxApertureWide = toNumberOrNull(current.maxApertureWide);
  const maxApertureTele = toNumberOrNull(current.maxApertureTele);
  const isPrime = current.isPrime ?? null;

  const normalizedCurrent: LensOpticsCurrent = {
    focalLengthMinMm: focalMin,
    focalLengthMaxMm: focalMax,
    isPrime,
    maxApertureWide,
    maxApertureTele,
  };

  const missing: LensOpticsBackfillProposal["missing"] = [];
  if (isMissingNumber(focalMin) || isMissingNumber(focalMax)) {
    missing.push("focalLength");
  }
  if (isPrime == null) {
    missing.push("isPrime");
  }
  if (isMissingNumber(maxApertureWide)) {
    missing.push("maxApertureWide");
  }

  const proposed: LensOpticsProposed = {};
  const fills: LensOpticsBackfillProposal["fills"] = [];

  const needsFocal =
    isMissingNumber(focalMin) || isMissingNumber(focalMax);
  const inferredFocal = parseFocalLengthFromName(name);

  if (needsFocal && inferredFocal) {
    // Fill both sides from the parse so the pair stays consistent.
    if (isMissingNumber(focalMin) || isMissingNumber(focalMax)) {
      proposed.focalLengthMinMm = inferredFocal.min;
      proposed.focalLengthMaxMm = inferredFocal.max;
      fills.push("focalLength");
    }
  }

  const afterFocalMin =
    proposed.focalLengthMinMm ?? normalizedCurrent.focalLengthMinMm;
  const afterFocalMax =
    proposed.focalLengthMaxMm ?? normalizedCurrent.focalLengthMaxMm;

  if (isPrime == null) {
    if (inferredFocal) {
      proposed.isPrime = inferredFocal.isPrime;
      fills.push("isPrime");
    } else if (
      afterFocalMin != null &&
      afterFocalMax != null &&
      Number.isFinite(afterFocalMin) &&
      Number.isFinite(afterFocalMax)
    ) {
      proposed.isPrime = afterFocalMin === afterFocalMax;
      fills.push("isPrime");
    }
  }

  const inferredAperture = parseApertureFromName(name);
  if (isMissingNumber(maxApertureWide) && inferredAperture) {
    proposed.maxApertureWide = inferredAperture.wide;
    fills.push("maxApertureWide");
  }
  if (
    isMissingNumber(maxApertureTele) &&
    inferredAperture?.tele !== undefined
  ) {
    proposed.maxApertureTele = inferredAperture.tele;
    fills.push("maxApertureTele");
  }

  const after: LensOpticsCurrent = {
    focalLengthMinMm:
      proposed.focalLengthMinMm ?? normalizedCurrent.focalLengthMinMm,
    focalLengthMaxMm:
      proposed.focalLengthMaxMm ?? normalizedCurrent.focalLengthMaxMm,
    isPrime: proposed.isPrime ?? normalizedCurrent.isPrime,
    maxApertureWide:
      proposed.maxApertureWide ?? normalizedCurrent.maxApertureWide,
    maxApertureTele:
      proposed.maxApertureTele ?? normalizedCurrent.maxApertureTele,
  };

  return {
    current: normalizedCurrent,
    proposed,
    after,
    fills,
    missing,
    actionable: fills.length > 0,
  };
}

export function isLensOpticsIncomplete(current: LensOpticsCurrent): boolean {
  return (
    isMissingNumber(current.focalLengthMinMm) ||
    isMissingNumber(current.focalLengthMaxMm) ||
    current.isPrime == null ||
    isMissingNumber(current.maxApertureWide)
  );
}
