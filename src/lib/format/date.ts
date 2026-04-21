export type DateLike = Date | string | number | null | undefined;
export type DatePrecision = "DAY" | "MONTH" | "YEAR";
type TimeZoneIdentifier = string & {};
export type DateTimeZoneOption = "local" | TimeZoneIdentifier;
export type DateFormatPreset =
  | "date-short"
  | "date-medium"
  | "date-long"
  | "datetime-short"
  | "datetime-medium"
  | "month-year-short"
  | "month-year-long"
  | "year";
export type PrecisionFormatVariant = "full" | "month-year";

const DEFAULT_TIME_ZONE = "UTC";
const DEFAULT_FALLBACK = "";
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MS_PER_MONTH = 30 * MS_PER_DAY;
const MS_PER_YEAR = 365 * MS_PER_DAY;
const JUST_NOW_THRESHOLD_MS = 5 * MS_PER_SECOND;

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const relativeFormatterCache = new Map<string, Intl.RelativeTimeFormat>();

function capitalizeFirstCharacter(value: string, locale: string): string {
  if (!value) {
    return value;
  }

  const [firstCharacter = "", ...rest] = Array.from(value);
  return firstCharacter.toLocaleUpperCase(locale) + rest.join("");
}

function resolveTimeZone(
  timeZone: DateTimeZoneOption | undefined,
): string | undefined {
  if (timeZone === "local") {
    return undefined;
  }

  return timeZone ?? DEFAULT_TIME_ZONE;
}

function getDateFormatter(
  locale: string,
  timeZone: DateTimeZoneOption | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const resolvedTimeZone = resolveTimeZone(timeZone);
  const cacheKey = JSON.stringify([locale, resolvedTimeZone ?? null, options]);
  const cached = dateFormatterCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    ...options,
    ...(resolvedTimeZone ? { timeZone: resolvedTimeZone } : {}),
  });
  dateFormatterCache.set(cacheKey, formatter);
  return formatter;
}

function getRelativeFormatter(
  locale: string,
  options: Intl.RelativeTimeFormatOptions,
): Intl.RelativeTimeFormat {
  const cacheKey = JSON.stringify([locale, options]);
  const cached = relativeFormatterCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.RelativeTimeFormat(locale, options);
  relativeFormatterCache.set(cacheKey, formatter);
  return formatter;
}

function getUtcDayStart(value: Date): number {
  return Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
  );
}

function getUtcMonthStart(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1);
}

function getUtcWeekStart(dayStartMs: number): number {
  const day = new Date(dayStartMs);
  return dayStartMs - day.getUTCDay() * MS_PER_DAY;
}

function formatCalendarRelativeDate(
  value: Date,
  now: Date,
  locale: string,
  style: "short" | "long",
  numeric: "always" | "auto",
): string | null {
  const formatter = getRelativeFormatter(locale, { style, numeric });
  const valueDayStart = getUtcDayStart(value);
  const nowDayStart = getUtcDayStart(now);
  const dayDiff = Math.round((valueDayStart - nowDayStart) / MS_PER_DAY);

  if (dayDiff >= -6 && dayDiff <= 6) {
    return formatter.format(dayDiff, "day");
  }

  const currentWeekStart = getUtcWeekStart(nowDayStart);
  const previousWeekStart = currentWeekStart - MS_PER_WEEK;
  const nextWeekStart = currentWeekStart + MS_PER_WEEK;

  if (valueDayStart >= previousWeekStart && valueDayStart < currentWeekStart) {
    return formatter.format(-1, "week");
  }

  if (
    valueDayStart >= nextWeekStart &&
    valueDayStart < nextWeekStart + MS_PER_WEEK
  ) {
    return formatter.format(1, "week");
  }

  const currentMonthStart = getUtcMonthStart(now);
  const previousMonthStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() - 1,
    1,
  );
  const nextMonthStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    1,
  );
  const monthAfterNextStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 2,
    1,
  );

  if (
    valueDayStart >= previousMonthStart &&
    valueDayStart < currentMonthStart
  ) {
    return formatter.format(-1, "month");
  }

  if (valueDayStart >= nextMonthStart && valueDayStart < monthAfterNextStart) {
    return formatter.format(1, "month");
  }

  return null;
}

function parseUtcDateParts(
  year: number,
  month: number,
  day: number,
): Date | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function parseDateLike(value: DateLike): Date | null {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}$/.test(trimmed)) {
    return parseUtcDateParts(Number(trimmed), 1, 1);
  }

  const yearMonthMatch = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (yearMonthMatch) {
    return parseUtcDateParts(
      Number(yearMonthMatch[1]),
      Number(yearMonthMatch[2]),
      1,
    );
  }

  const yearMonthDayMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yearMonthDayMatch) {
    return parseUtcDateParts(
      Number(yearMonthDayMatch[1]),
      Number(yearMonthDayMatch[2]),
      Number(yearMonthDayMatch[3]),
    );
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getFormatPresetOptions(
  preset: DateFormatPreset,
): Intl.DateTimeFormatOptions {
  switch (preset) {
    case "date-short":
      return { year: "numeric", month: "numeric", day: "numeric" };
    case "date-medium":
      return { dateStyle: "medium" };
    case "date-long":
      return { dateStyle: "long" };
    case "datetime-short":
      return { dateStyle: "medium", timeStyle: "short" };
    case "datetime-medium":
      return { dateStyle: "medium", timeStyle: "medium" };
    case "month-year-short":
      return { month: "short", year: "numeric" };
    case "month-year-long":
      return { month: "long", year: "numeric" };
    case "year":
      return { year: "numeric" };
  }
}

export function formatDate(
  value: DateLike,
  options: {
    locale: string;
    preset: DateFormatPreset;
    timeZone?: DateTimeZoneOption;
    fallback?: string;
  },
): string {
  const parsed = parseDateLike(value);
  if (!parsed) {
    return options.fallback ?? DEFAULT_FALLBACK;
  }

  return getDateFormatter(
    options.locale,
    options.timeZone,
    getFormatPresetOptions(options.preset),
  ).format(parsed);
}

export function formatDateWithPrecision(
  value: DateLike,
  options: {
    locale: string;
    precision?: DatePrecision | null;
    variant?: PrecisionFormatVariant;
    monthStyle?: "short" | "long";
    timeZone?: DateTimeZoneOption;
    fallback?: string;
  },
): string {
  const parsed = parseDateLike(value);
  if (!parsed) {
    return options.fallback ?? DEFAULT_FALLBACK;
  }

  const precision = options.precision ?? "DAY";
  const variant = options.variant ?? "full";
  const monthStyle = options.monthStyle ?? "long";

  if (precision === "YEAR") {
    return formatDate(parsed, {
      locale: options.locale,
      preset: "year",
      timeZone: options.timeZone,
      fallback: options.fallback,
    });
  }

  if (precision === "MONTH" || variant === "month-year") {
    return formatDate(parsed, {
      locale: options.locale,
      preset:
        monthStyle === "short" ? "month-year-short" : "month-year-long",
      timeZone: options.timeZone,
      fallback: options.fallback,
    });
  }

  return getDateFormatter(options.locale, options.timeZone, {
    year: "numeric",
    month: monthStyle,
    day: "numeric",
  }).format(parsed);
}

export function formatRelativeDate(
  value: DateLike,
  options: {
    locale: string;
    style?: "short" | "long";
    numeric?: "always" | "auto";
    now?: DateLike;
    fallback?: string;
    justNowLabel?: string;
    capitalize?: boolean;
  },
): string {
  const parsed = parseDateLike(value);
  const now = parseDateLike(options.now ?? new Date());
  if (!parsed || !now) {
    return options.fallback ?? DEFAULT_FALLBACK;
  }

  const style = options.style ?? "long";
  const numeric = options.numeric ?? "auto";
  const diffMs = parsed.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);

  if (numeric !== "always" && absDiffMs < JUST_NOW_THRESHOLD_MS) {
    const result =
      options.justNowLabel ??
      getRelativeFormatter(options.locale, {
        style,
        numeric,
      }).format(0, "second");
    return options.capitalize
      ? capitalizeFirstCharacter(result, options.locale)
      : result;
  }

  if (style === "long" && numeric === "auto") {
    const calendarFormatted = formatCalendarRelativeDate(
      parsed,
      now,
      options.locale,
      style,
      numeric,
    );

    if (calendarFormatted) {
      return options.capitalize
        ? capitalizeFirstCharacter(calendarFormatted, options.locale)
        : calendarFormatted;
    }
  }

  let unit: Intl.RelativeTimeFormatUnit;
  let divisor: number;

  if (absDiffMs < MS_PER_MINUTE) {
    unit = "second";
    divisor = MS_PER_SECOND;
  } else if (absDiffMs < MS_PER_HOUR) {
    unit = "minute";
    divisor = MS_PER_MINUTE;
  } else if (absDiffMs < MS_PER_DAY) {
    unit = "hour";
    divisor = MS_PER_HOUR;
  } else if (absDiffMs < MS_PER_WEEK) {
    unit = "day";
    divisor = MS_PER_DAY;
  } else if (absDiffMs < MS_PER_MONTH) {
    unit = "week";
    divisor = MS_PER_WEEK;
  } else if (absDiffMs < MS_PER_YEAR) {
    unit = "month";
    divisor = MS_PER_MONTH;
  } else {
    unit = "year";
    divisor = MS_PER_YEAR;
  }

  const valueForUnit = Math.round(diffMs / divisor);
  const result = getRelativeFormatter(options.locale, {
    style,
    numeric,
  }).format(valueForUnit, unit);
  return options.capitalize
    ? capitalizeFirstCharacter(result, options.locale)
    : result;
}

export function formatDateInputValue(
  value: DateLike,
  options?: {
    fallback?: string;
  },
): string {
  const parsed = parseDateLike(value);
  if (!parsed) {
    return options?.fallback ?? DEFAULT_FALLBACK;
  }

  const year = String(parsed.getUTCFullYear()).padStart(4, "0");
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
