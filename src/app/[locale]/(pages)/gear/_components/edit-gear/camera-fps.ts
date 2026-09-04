export const shutterTypeOrder = ["mechanical", "efc", "electronic"] as const;

export type ShutterType = (typeof shutterTypeOrder)[number];
export type ShutterFpsEntry = { raw?: number | null; jpg?: number | null };
export type ShutterFpsByType = Partial<Record<ShutterType, ShutterFpsEntry>>;

export function normalizeShutterTypeKey(value: string): ShutterType | null {
  const lowered = value.toLowerCase();
  if (lowered === "efcs") return "efc";
  if (shutterTypeOrder.includes(lowered as ShutterType)) {
    return lowered as ShutterType;
  }
  return null;
}

function normalizeFpsNumericValue(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? Math.round(parsed * 10) / 10 : undefined;
}

export function normalizeMaxFpsByShutterValue(
  value: unknown,
  availableShutterTypes: readonly string[],
): ShutterFpsByType {
  if (!value || typeof value !== "object") return {};

  const allowedNormalized = availableShutterTypes
    .map(normalizeShutterTypeKey)
    .filter((type): type is ShutterType => type !== null);
  const allowedSet = new Set(allowedNormalized);
  const collected: ShutterFpsByType = {};

  for (const [rawKey, rawValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const normalizedKey = normalizeShutterTypeKey(rawKey);
    if (!normalizedKey) continue;
    if (allowedSet.size > 0 && !allowedSet.has(normalizedKey)) continue;
    if (typeof rawValue !== "object" || rawValue === null) continue;

    const entry = rawValue as Record<string, unknown>;
    const raw = normalizeFpsNumericValue(entry.raw);
    const jpg = normalizeFpsNumericValue(entry.jpg);
    if (raw === undefined && jpg === undefined) continue;
    collected[normalizedKey] = {
      ...(raw !== undefined ? { raw } : {}),
      ...(jpg !== undefined ? { jpg } : {}),
    };
  }

  const result: ShutterFpsByType = {};
  const ordering =
    allowedNormalized.length > 0 ? allowedNormalized : shutterTypeOrder;
  for (const shutterType of ordering) {
    if (collected[shutterType]) result[shutterType] = collected[shutterType];
  }
  return result;
}

export function computeHeadlineMaxFps(shutterMap: ShutterFpsByType): {
  maxRaw: number | null;
  maxJpg: number | null;
} {
  let maxRaw: number | null = null;
  let maxJpg: number | null = null;
  for (const entry of Object.values(shutterMap)) {
    if (typeof entry?.raw === "number") {
      maxRaw = maxRaw === null ? entry.raw : Math.max(maxRaw, entry.raw);
    }
    if (typeof entry?.jpg === "number") {
      maxJpg = maxJpg === null ? entry.jpg : Math.max(maxJpg, entry.jpg);
    }
  }
  return { maxRaw, maxJpg };
}
