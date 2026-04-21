import { describe, expect, it } from "vitest";
import type { ExifTrackedCameraHistoryEntry } from "../../src/app/[locale]/(pages)/(tools)/exif-viewer/types";
import {
  buildExifTrackingChartPoints,
  countSeriesPoints,
  formatChartTooltipDate,
  getCombinedSeriesDomain,
  getSeriesDomain,
  resolveFullChartSeries,
  resolveMiniChartSeries,
  resolveReadingPlotTimestamp,
} from "../../src/app/[locale]/(pages)/(tools)/exif-viewer/_components/exif-tracking-chart-utils";

function createReading(
  overrides: Partial<ExifTrackedCameraHistoryEntry> = {},
): ExifTrackedCameraHistoryEntry {
  return {
    id: "reading-1",
    captureAt: "2024-10-02T22:45:12.000Z",
    primaryCountType: "total",
    primaryCountValue: 12000,
    shutterCount: 12000,
    totalShutterCount: 12000,
    mechanicalShutterCount: 9000,
    createdAt: "2024-10-03T00:00:00.000Z",
    ...overrides,
  };
}

describe("exif tracking chart utils", () => {
  it("prefers captureAt over createdAt for plot timestamps", () => {
    const timestamp = resolveReadingPlotTimestamp(createReading());

    expect(timestamp).toEqual({
      plottedAt: "2024-10-02T22:45:12.000Z",
      plottedAtMs: new Date("2024-10-02T22:45:12.000Z").getTime(),
      timeSource: "capture",
    });
  });

  it("falls back to createdAt when captureAt is missing", () => {
    const timestamp = resolveReadingPlotTimestamp(
      createReading({
        captureAt: null,
        createdAt: "2024-10-05T12:00:00.000Z",
      }),
    );

    expect(timestamp).toEqual({
      plottedAt: "2024-10-05T12:00:00.000Z",
      plottedAtMs: new Date("2024-10-05T12:00:00.000Z").getTime(),
      timeSource: "saved",
    });
  });

  it("sorts chart points ascending by plotted timestamp", () => {
    const points = buildExifTrackingChartPoints([
      createReading({
        id: "reading-2",
        captureAt: "2024-10-03T00:00:00.000Z",
      }),
      createReading({
        id: "reading-1",
        captureAt: "2024-10-01T00:00:00.000Z",
      }),
    ]);

    expect(points.map((point) => point.readingId)).toEqual([
      "reading-1",
      "reading-2",
    ]);
  });

  it("collapses multiple readings from the same day into one chart point", () => {
    const points = buildExifTrackingChartPoints([
      createReading({
        id: "reading-1",
        captureAt: "2024-10-02T12:00:00.000Z",
        totalShutterCount: 22820,
        primaryCountValue: 22820,
      }),
      createReading({
        id: "reading-2",
        captureAt: "2024-10-02T19:00:00.000Z",
        totalShutterCount: 22825,
        primaryCountValue: 22825,
      }),
    ]);

    expect(points).toHaveLength(1);
    expect(points[0]?.plottedAt).toBe(new Date(2024, 9, 2).toISOString());
    expect(points[0]?.totalCountValue).toBe(22825);
    expect(points[0]?.primaryCountValue).toBe(22825);
  });

  it("keeps the highest value for each series within a day", () => {
    const points = buildExifTrackingChartPoints([
      createReading({
        id: "reading-1",
        captureAt: "2024-10-02T12:00:00.000Z",
        totalShutterCount: 22820,
        mechanicalShutterCount: 18001,
        primaryCountValue: 22820,
      }),
      createReading({
        id: "reading-2",
        captureAt: "2024-10-02T19:00:00.000Z",
        totalShutterCount: 22825,
        mechanicalShutterCount: 18000,
        primaryCountValue: 22825,
      }),
    ]);

    expect(points[0]?.totalCountValue).toBe(22825);
    expect(points[0]?.mechanicalCountValue).toBe(18001);
  });

  it("anchors daily chart points to the local calendar day", () => {
    const captureAt = "2024-10-02T00:30:00.000Z";
    const captureDate = new Date(captureAt);
    const expectedLocalDayStart = new Date(
      captureDate.getFullYear(),
      captureDate.getMonth(),
      captureDate.getDate(),
    );
    const points = buildExifTrackingChartPoints([
      createReading({
        captureAt,
      }),
    ]);

    expect(points[0]?.plottedAt).toBe(expectedLocalDayStart.toISOString());
    expect(points[0]?.plottedAtMs).toBe(expectedLocalDayStart.getTime());
  });

  it("prefers total, then mechanical, then generic for the mini chart", () => {
    expect(
      resolveMiniChartSeries(
        buildExifTrackingChartPoints([
          createReading(),
        ]),
      ),
    ).toBe("total");

    expect(
      resolveMiniChartSeries(
        buildExifTrackingChartPoints([
          createReading({
            totalShutterCount: null,
            primaryCountType: "mechanical",
            primaryCountValue: 9000,
            shutterCount: null,
          }),
        ]),
      ),
    ).toBe("mechanical");

    expect(
      resolveMiniChartSeries(
        buildExifTrackingChartPoints([
          createReading({
            totalShutterCount: null,
            mechanicalShutterCount: null,
            primaryCountType: "generic",
            primaryCountValue: 88,
            shutterCount: 88,
          }),
        ]),
      ),
    ).toBe("generic");
  });

  it("returns both total and mechanical series when both exist", () => {
    const series = resolveFullChartSeries(
      buildExifTrackingChartPoints([
        createReading(),
      ]),
    );

    expect(series).toEqual(["total", "mechanical"]);
  });

  it("falls back to one series when only one count family exists", () => {
    expect(
      resolveFullChartSeries(
        buildExifTrackingChartPoints([
          createReading({
            totalShutterCount: null,
            primaryCountType: "mechanical",
            primaryCountValue: 9000,
            shutterCount: null,
          }),
        ]),
      ),
    ).toEqual(["mechanical"]);

    expect(
      resolveFullChartSeries(
        buildExifTrackingChartPoints([
          createReading({
            totalShutterCount: null,
            mechanicalShutterCount: null,
            primaryCountType: "generic",
            primaryCountValue: 88,
            shutterCount: 88,
          }),
        ]),
      ),
    ).toEqual(["generic"]);
  });

  it("counts plottable points for sparse series correctly", () => {
    const points = buildExifTrackingChartPoints([
      createReading(),
      createReading({
        id: "reading-2",
        captureAt: "2024-10-04T00:00:00.000Z",
        totalShutterCount: null,
        primaryCountType: "mechanical",
        primaryCountValue: 9200,
      }),
    ]);

    expect(countSeriesPoints(points, "total")).toBe(1);
    expect(countSeriesPoints(points, "mechanical")).toBe(2);
  });

  it("formats tooltip dates with their time source label", () => {
    expect(
      formatChartTooltipDate({
        plottedAt: "2024-10-02T22:45:12.000Z",
        timeSource: "capture",
      }),
    ).toContain("Captured");

    expect(
      formatChartTooltipDate({
        plottedAt: "2024-10-03T00:00:00.000Z",
        timeSource: "saved",
      }),
    ).toContain("Saved");
    expect(
      formatChartTooltipDate({
        plottedAt: "2024-10-03T00:00:00.000Z",
        timeSource: "saved",
      }),
    ).not.toContain(":");
  });

  it("builds a tight domain for small shutter-count changes", () => {
    const points = buildExifTrackingChartPoints([
      createReading({
        id: "reading-1",
        totalShutterCount: 22820,
        primaryCountValue: 22820,
      }),
      createReading({
        id: "reading-2",
        captureAt: "2024-10-03T22:45:12.000Z",
        totalShutterCount: 22825,
        primaryCountValue: 22825,
      }),
    ]);

    expect(getSeriesDomain(points, "total")).toEqual([22819, 22826]);
  });

  it("builds a combined domain for the full chart from visible series", () => {
    const points = buildExifTrackingChartPoints([
      createReading({
        id: "reading-1",
        totalShutterCount: 22820,
        mechanicalShutterCount: 18000,
        primaryCountValue: 22820,
      }),
      createReading({
        id: "reading-2",
        captureAt: "2024-10-03T22:45:12.000Z",
        totalShutterCount: 22825,
        mechanicalShutterCount: 18004,
        primaryCountValue: 22825,
      }),
    ]);

    expect(getCombinedSeriesDomain(points, ["total", "mechanical"])).toEqual([
      17421,
      23404,
    ]);
  });

  it("never returns a negative chart minimum", () => {
    const points = buildExifTrackingChartPoints([
      createReading({
        totalShutterCount: null,
        mechanicalShutterCount: null,
        primaryCountType: "generic",
        primaryCountValue: 1,
        shutterCount: 1,
      }),
      createReading({
        id: "reading-2",
        captureAt: "2024-10-03T22:45:12.000Z",
        totalShutterCount: null,
        mechanicalShutterCount: null,
        primaryCountType: "generic",
        primaryCountValue: 2,
        shutterCount: 2,
      }),
    ]);

    expect(getSeriesDomain(points, "generic")).toEqual([0, 3]);
  });
});
