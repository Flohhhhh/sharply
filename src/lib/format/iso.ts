function toIsoNumber(value: unknown): number | null {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

const DEFAULT_ISO_LOCALE = "en-US";
const isoNumberFormatters = new Map<string, Intl.NumberFormat>();

function formatIsoNumber(value: number, locale?: string): string {
  const activeLocale = locale ?? DEFAULT_ISO_LOCALE;
  let formatter = isoNumberFormatters.get(activeLocale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(activeLocale);
    isoNumberFormatters.set(activeLocale, formatter);
  }
  return formatter.format(value);
}

export function formatIsoOption(value: number, locale?: string): string {
  return `ISO ${formatIsoNumber(value, locale)}`;
}

export function formatIsoValue(
  value: unknown,
  locale?: string,
): string | undefined {
  const numberValue = toIsoNumber(value);
  return numberValue == null
    ? undefined
    : `ISO ${formatIsoNumber(numberValue, locale)}`;
}

export function formatIsoRange(
  minValue: unknown,
  maxValue: unknown,
  options: { allowPartial?: boolean; locale?: string } = {},
): string | undefined {
  const min = toIsoNumber(minValue);
  const max = toIsoNumber(maxValue);

  if (min != null && max != null) {
    return `ISO ${formatIsoNumber(min, options.locale)} - ${formatIsoNumber(
      max,
      options.locale,
    )}`;
  }
  if (options.allowPartial === false) return undefined;
  if (min != null) return `ISO ${formatIsoNumber(min, options.locale)}+`;
  if (max != null) return `ISO ≤ ${formatIsoNumber(max, options.locale)}`;
  return undefined;
}

export function normalizeBaseIsoValues(values: readonly number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

export function formatBaseIsoValues(
  values: unknown,
  locale?: string,
): string | undefined {
  if (!Array.isArray(values)) return undefined;
  const normalized = values
    .map(toIsoNumber)
    .filter((value): value is number => value != null);
  if (normalized.length === 0) return undefined;
  return normalizeBaseIsoValues(normalized)
    .map((value) => formatIsoNumber(value, locale))
    .join(" / ");
}
