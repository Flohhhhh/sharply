import type {
  ExifTrackedCameraHistoryEntry,
  ExifTrackingChartSeries,
} from "../types";

export type ExifTrackingChartTimeSource = "capture" | "saved";

export type ExifTrackingChartPoint = {
  readingId: string;
  plottedAt: string;
  plottedAtMs: number;
  plottedAtLabel: string;
  timeSource: ExifTrackingChartTimeSource;
  primaryCountValue: number | null;
  totalCountValue: number | null;
  mechanicalCountValue: number | null;
  genericCountValue: number | null;
};

function getLocalDayKey(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocalDayAnchor(value: Date): {
  dayKey: string;
  plottedAt: string;
  plottedAtMs: number;
} {
  const localDayStart = new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );

  return {
    dayKey: getLocalDayKey(localDayStart),
    plottedAt: localDayStart.toISOString(),
    plottedAtMs: localDayStart.getTime(),
  };
}

function maxNullableNumber(
  currentValue: number | null,
  nextValue: number | null,
): number | null {
  if (currentValue === null) {
    return nextValue;
  }

  if (nextValue === null) {
    return currentValue;
  }

  return Math.max(currentValue, nextValue);
}

function parseDateValue(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function formatChartCount(value: number | null | undefined): string {
  return value === null || value === undefined ? "-" : value.toLocaleString();
}

export function formatChartAxisDate(value: string | number): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  const now = new Date();
  const includeYear = parsed.getFullYear() !== now.getFullYear();

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" as const } : {}),
  }).format(parsed);
}

export function formatChartTooltipDate(params: {
  plottedAt: string;
  timeSource: ExifTrackingChartTimeSource;
}): string {
  const parsed = new Date(params.plottedAt);

  if (Number.isNaN(parsed.getTime())) {
    return params.plottedAt;
  }

  const prefix = params.timeSource === "capture" ? "Captured" : "Saved";

  return `${prefix} ${new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(parsed)}`;
}

export function resolveReadingPlotTimestamp(
  reading: ExifTrackedCameraHistoryEntry,
): {
  plottedAt: string;
  plottedAtMs: number;
  timeSource: ExifTrackingChartTimeSource;
} | null {
  const captureDate = parseDateValue(reading.captureAt);

  if (captureDate) {
    return {
      plottedAt: captureDate.toISOString(),
      plottedAtMs: captureDate.getTime(),
      timeSource: "capture",
    };
  }

  const savedDate = parseDateValue(reading.createdAt);

  if (!savedDate) {
    return null;
  }

  return {
    plottedAt: savedDate.toISOString(),
    plottedAtMs: savedDate.getTime(),
    timeSource: "saved",
  };
}

export function buildExifTrackingChartPoints(
  readings: ExifTrackedCameraHistoryEntry[],
): ExifTrackingChartPoint[] {
  const pointMap = new Map<string, ExifTrackingChartPoint>();

  for (const reading of readings) {
    const timestamp = resolveReadingPlotTimestamp(reading);

    if (!timestamp) {
      continue;
    }

    const dayAnchor = getLocalDayAnchor(new Date(timestamp.plottedAtMs));
    const dayKey = dayAnchor.dayKey;
    const existingPoint = pointMap.get(dayKey);
    const genericCountValue =
      reading.primaryCountType === "generic"
        ? reading.primaryCountValue
        : null;

    if (!existingPoint) {
      pointMap.set(dayKey, {
        readingId: reading.id,
        plottedAt: dayAnchor.plottedAt,
        plottedAtMs: dayAnchor.plottedAtMs,
        plottedAtLabel: formatChartAxisDate(dayAnchor.plottedAtMs),
        timeSource: timestamp.timeSource,
        primaryCountValue: reading.primaryCountValue,
        totalCountValue: reading.totalShutterCount,
        mechanicalCountValue: reading.mechanicalShutterCount,
        genericCountValue,
      });
      continue;
    }

    existingPoint.readingId = reading.id;
    existingPoint.timeSource =
      existingPoint.timeSource === "capture" || timestamp.timeSource === "capture"
        ? "capture"
        : "saved";
    existingPoint.primaryCountValue = maxNullableNumber(
      existingPoint.primaryCountValue,
      reading.primaryCountValue,
    );
    existingPoint.totalCountValue = maxNullableNumber(
      existingPoint.totalCountValue,
      reading.totalShutterCount,
    );
    existingPoint.mechanicalCountValue = maxNullableNumber(
      existingPoint.mechanicalCountValue,
      reading.mechanicalShutterCount,
    );
    existingPoint.genericCountValue = maxNullableNumber(
      existingPoint.genericCountValue,
      genericCountValue,
    );
  }

  return Array.from(pointMap.values()).sort(
    (left, right) => left.plottedAtMs - right.plottedAtMs,
  );
}

export function getChartPointValue(
  point: ExifTrackingChartPoint,
  series: ExifTrackingChartSeries,
): number | null {
  switch (series) {
    case "total":
      return point.totalCountValue;
    case "mechanical":
      return point.mechanicalCountValue;
    case "generic":
      return point.genericCountValue;
  }
}

export function countSeriesPoints(
  points: ExifTrackingChartPoint[],
  series: ExifTrackingChartSeries,
): number {
  return points.filter((point) => getChartPointValue(point, series) !== null)
    .length;
}

export function hasSeriesData(
  points: ExifTrackingChartPoint[],
  series: ExifTrackingChartSeries,
): boolean {
  return countSeriesPoints(points, series) > 0;
}

export function getSeriesValues(
  points: ExifTrackingChartPoint[],
  series: ExifTrackingChartSeries,
): number[] {
  return points.flatMap((point) => {
    const value = getChartPointValue(point, series);
    return value === null ? [] : [value];
  });
}

export function getSeriesDomain(
  points: ExifTrackingChartPoint[],
  series: ExifTrackingChartSeries,
): [number, number] | null {
  return getChartDomainFromValues(getSeriesValues(points, series));
}

export function getCombinedSeriesDomain(
  points: ExifTrackingChartPoint[],
  seriesList: ExifTrackingChartSeries[],
): [number, number] | null {
  return getChartDomainFromValues(
    seriesList.flatMap((series) => getSeriesValues(points, series)),
  );
}

function getChartDomainFromValues(values: number[]): [number, number] | null {

  if (values.length === 0) {
    return null;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (minValue === maxValue) {
    const padding = Math.max(1, Math.ceil(Math.abs(minValue) * 0.01));
    return [Math.max(0, minValue - padding), maxValue + padding];
  }

  const range = maxValue - minValue;
  const padding = Math.max(1, Math.ceil(range * 0.12));

  return [Math.max(0, minValue - padding), maxValue + padding];
}

export function resolveMiniChartSeries(
  points: ExifTrackingChartPoint[],
): ExifTrackingChartSeries | null {
  if (hasSeriesData(points, "total")) {
    return "total";
  }

  if (hasSeriesData(points, "mechanical")) {
    return "mechanical";
  }

  if (hasSeriesData(points, "generic")) {
    return "generic";
  }

  return null;
}

export function resolveFullChartSeries(
  points: ExifTrackingChartPoint[],
): ExifTrackingChartSeries[] {
  const hasTotal = hasSeriesData(points, "total");
  const hasMechanical = hasSeriesData(points, "mechanical");
  const hasGeneric = hasSeriesData(points, "generic");

  if (hasTotal && hasMechanical) {
    return ["total", "mechanical"];
  }

  if (hasTotal) {
    return ["total"];
  }

  if (hasMechanical) {
    return ["mechanical"];
  }

  if (hasGeneric) {
    return ["generic"];
  }

  return [];
}
