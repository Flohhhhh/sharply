function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toTimestamp(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

type ComparisonMode = "exact" | "numeric" | "temporal";

export type DiffComparisonOptions = {
  numericKeys?: readonly string[];
  temporalKeys?: readonly string[];
};

export function editValuesEqual(
  a: unknown,
  b: unknown,
  mode: ComparisonMode = "exact",
): boolean {
  if (Object.is(a, b)) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((value, index) => editValuesEqual(value, b[index], mode));
  }

  if (mode === "temporal") {
    const aTimestamp = toTimestamp(a);
    const bTimestamp = toTimestamp(b);
    if (aTimestamp !== null && bTimestamp !== null) {
      return aTimestamp === bTimestamp;
    }
  }

  if (mode === "numeric") {
    const aNumber = toFiniteNumber(a);
    const bNumber = toFiniteNumber(b);
    if (aNumber !== null && bNumber !== null) return aNumber === bNumber;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(
      (key) => Object.hasOwn(b, key) && editValuesEqual(a[key], b[key], mode),
    );
  }

  return false;
}

export function diffRecordByKeys(
  original: Record<string, unknown>,
  updated: Record<string, unknown>,
  keys: readonly string[],
  options: DiffComparisonOptions = {},
): Record<string, unknown> {
  const diff: Record<string, unknown> = {};
  const numericKeys = new Set(options.numericKeys ?? []);
  const temporalKeys = new Set(options.temporalKeys ?? []);
  for (const key of keys) {
    const mode: ComparisonMode = temporalKeys.has(key)
      ? "temporal"
      : numericKeys.has(key)
        ? "numeric"
        : "exact";
    if (key in updated && !editValuesEqual(original[key], updated[key], mode)) {
      diff[key] = updated[key] ?? null;
    }
  }
  return diff;
}
