export function formatBooleanText(
  value: unknown,
  t: (key: string) => string,
): string | null {
  if (typeof value !== "boolean") return null;
  return value ? t("yes") : t("no");
}
