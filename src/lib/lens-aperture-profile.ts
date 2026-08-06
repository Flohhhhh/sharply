export type ApertureProfilePoint = {
  focalLength: number;
  aperture: number;
};

export type ApertureProfileBounds = {
  focalLengthMinMm: number | null | undefined;
  focalLengthMaxMm: number | null | undefined;
  maxApertureWide: number | string | null | undefined;
  maxApertureTele: number | string | null | undefined;
  isPrime?: boolean | null;
};

function numberOrNull(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function getVariableApertureProfileEndpoints(
  bounds: ApertureProfileBounds,
): ApertureProfilePoint[] | null {
  const min = numberOrNull(bounds.focalLengthMinMm);
  const max = numberOrNull(bounds.focalLengthMaxMm);
  const wide = numberOrNull(bounds.maxApertureWide);
  const tele = numberOrNull(bounds.maxApertureTele);
  if (
    bounds.isPrime === true ||
    min == null ||
    max == null ||
    wide == null ||
    tele == null ||
    min >= max ||
    wide <= 0 ||
    tele <= 0 ||
    wide === tele
  ) {
    return null;
  }
  return [
    { focalLength: min, aperture: wide },
    { focalLength: max, aperture: tele },
  ];
}

export function normalizeApertureProfile(
  value: unknown,
  endpoints?: ApertureProfilePoint[] | null,
): ApertureProfilePoint[] | null {
  if (!Array.isArray(value)) return null;
  const points = value.map((point) => {
    if (!point || typeof point !== "object") return null;
    const record = point as Record<string, unknown>;
    const focalLength = numberOrNull(record.focalLength);
    const aperture = numberOrNull(record.aperture);
    if (focalLength == null || aperture == null || focalLength <= 0 || aperture <= 0)
      return null;
    return { focalLength, aperture };
  });
  if (points.some((point) => point == null)) return null;
  const sorted = [...(points as ApertureProfilePoint[])].sort(
    (a, b) => a.focalLength - b.focalLength,
  );
  if (new Set(sorted.map((point) => point.focalLength)).size !== sorted.length)
    return null;
  if (!endpoints) return sorted;
  const [start, end] = endpoints;
  if (!start || !end) return null;
  const intermediates = sorted.filter(
    (point) => point.focalLength > start.focalLength && point.focalLength < end.focalLength,
  );
  if (intermediates.length !== sorted.length - 2) return null;
  const expected = [start, ...intermediates, end];
  if (
    sorted.length !== expected.length ||
    sorted.some(
      (point, index) =>
        point.focalLength !== expected[index]?.focalLength ||
        point.aperture !== expected[index]?.aperture,
    )
  ) return null;
  return sorted;
}

export function formatApertureProfileNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
}

export function apertureProfileColor(
  aperture: number,
  points: ApertureProfilePoint[],
  opacity = 0.68,
): string {
  const apertures = points.map((point) => point.aperture);
  const min = Math.min(...apertures);
  const max = Math.max(...apertures);
  const progress = max === min ? 0 : (aperture - min) / (max - min);
  const hue = 142 - Math.round(Math.max(0, Math.min(1, progress)) * 114);
  return `hsl(${hue} 68% 43% / ${opacity})`;
}

export function apertureProfileSegmentColor(
  index: number,
  count: number,
): string {
  const progress = count <= 1 ? 0 : index / (count - 1);
  const normalized = Math.max(0, Math.min(1, progress));
  const hue =
    normalized <= 0.5
      ? 142 - (92 * normalized) / 0.5
      : 50 - (22 * (normalized - 0.5)) / 0.5;
  return `hsl(${Math.round(hue)} 72% 48% / 0.68)`;
}
