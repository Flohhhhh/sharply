export function formatBooleanText(
  value: unknown,
  labels: { yes: string; no: string },
): string | null {
  if (typeof value !== "boolean") return null;
  return value ? labels.yes : labels.no;
}
