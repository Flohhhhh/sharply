type DatePrecision = "DAY" | "MONTH" | "YEAR";

export function isNewRelease(
  dateValue?: string | Date | null,
  precision?: DatePrecision | null,
): boolean {
  if (!dateValue) return false;
  // Skip year-only precision to avoid false positives on partial dates.
  if (precision === "YEAR") return false;

  const parsedDate =
    dateValue instanceof Date ? dateValue : new Date(dateValue ?? undefined);
  if (Number.isNaN(parsedDate.getTime())) return false;

  const threeMonthsMs = 1000 * 60 * 60 * 24 * 90;
  return Date.now() - parsedDate.getTime() <= threeMonthsMs;
}
