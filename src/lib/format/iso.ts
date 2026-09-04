function toIsoNumber(value: unknown): number | null {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

const isoOptionNumberFormatter = new Intl.NumberFormat("en-US");

function formatIsoNumber(value: number): string {
  return isoOptionNumberFormatter.format(value);
}

export function formatIsoOption(value: number): string {
  return `ISO ${formatIsoNumber(value)}`;
}

export function formatIsoValue(value: unknown): string | undefined {
  const numberValue = toIsoNumber(value);
  return numberValue == null
    ? undefined
    : `ISO ${formatIsoNumber(numberValue)}`;
}

export function formatIsoRange(
  minValue: unknown,
  maxValue: unknown,
  options: { allowPartial?: boolean } = {},
): string | undefined {
  const min = toIsoNumber(minValue);
  const max = toIsoNumber(maxValue);

  if (min != null && max != null) {
    return `ISO ${formatIsoNumber(min)} - ${formatIsoNumber(max)}`;
  }
  if (options.allowPartial === false) return undefined;
  if (min != null) return `ISO ${formatIsoNumber(min)}+`;
  if (max != null) return `ISO ≤ ${formatIsoNumber(max)}`;
  return undefined;
}
