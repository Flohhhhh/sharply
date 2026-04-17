"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "~/components/ui/chart";
import type {
  ExifTrackedCameraHistoryEntry,
  ExifTrackingChartSeries,
} from "../types";
import {
  buildExifTrackingChartPoints,
  countSeriesPoints,
  formatChartAxisDate,
  formatChartCount,
  formatChartTooltipDate,
  getCombinedSeriesDomain,
  resolveFullChartSeries,
} from "./exif-tracking-chart-utils";

type ExifTrackingHistoryChartProps = {
  readings: ExifTrackedCameraHistoryEntry[];
};

const HISTORY_CHART_CONFIG: ChartConfig = {
  totalCountValue: {
    label: "Total shutter count",
    color: "var(--color-foreground)",
  },
  mechanicalCountValue: {
    label: "Mechanical shutter count",
    color: "#a3e635",
  },
  genericCountValue: {
    label: "Shutter count",
    color: "#a3e635",
  },
};

function getSeriesDataKey(series: ExifTrackingChartSeries) {
  switch (series) {
    case "total":
      return "totalCountValue";
    case "mechanical":
      return "mechanicalCountValue";
    case "generic":
      return "genericCountValue";
  }
}

function HistoryChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    value?: number | string | null;
    payload?: {
      plottedAt: string;
      timeSource: "capture" | "saved";
    };
  }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  return (
    <div className="grid min-w-[220px] gap-2 rounded-lg border border-white/10 bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      {point ? (
        <div className="font-medium text-foreground">
          {formatChartTooltipDate({
            plottedAt: point.plottedAt,
            timeSource: point.timeSource,
          })}
        </div>
      ) : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.value !== null && item.value !== undefined)
          .map((item) => (
            <div
              key={String(item.dataKey ?? item.value)}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: item.color ?? "currentColor",
                  }}
                />
                <span className="text-muted-foreground">
                  {HISTORY_CHART_CONFIG[String(item.dataKey)]?.label ??
                    item.dataKey}
                </span>
              </div>
              <span className="font-medium text-foreground">
                {typeof item.value === "number"
                  ? formatChartCount(item.value)
                  : item.value}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function ExifTrackingHistoryChart({
  readings,
}: ExifTrackingHistoryChartProps) {
  const chartPoints = useMemo(
    () => buildExifTrackingChartPoints(readings),
    [readings],
  );
  const fullChartSeries = useMemo(
    () => resolveFullChartSeries(chartPoints),
    [chartPoints],
  );
  const yAxisDomain = useMemo(
    () => getCombinedSeriesDomain(chartPoints, fullChartSeries),
    [chartPoints, fullChartSeries],
  );

  if (chartPoints.length === 0 || fullChartSeries.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 px-4 py-5 text-sm text-zinc-400">
        No chartable shutter-count history is available yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 p-3 sm:p-4">
      <div className="space-y-3">
        <ChartContainer
          config={HISTORY_CHART_CONFIG}
          className="h-[260px] w-full"
        >
          <LineChart
            data={chartPoints}
            margin={{ top: 8, right: 12, bottom: 0, left: 6 }}
          >
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
            <XAxis
              type="number"
              dataKey="plottedAtMs"
              scale="time"
              domain={["dataMin", "dataMax"]}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
              tickMargin={10}
              tickFormatter={formatChartAxisDate}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={72}
              tickMargin={10}
              domain={yAxisDomain ?? undefined}
              tickFormatter={(value) => formatChartCount(Number(value))}
            />
            <ChartTooltip
              cursor={{ stroke: "rgba(255,255,255,0.16)" }}
              content={<HistoryChartTooltip />}
            />
            {fullChartSeries.length > 1 ? (
              <ChartLegend content={<ChartLegendContent />} />
            ) : null}
            {fullChartSeries.map((series) => {
              const dataKey = getSeriesDataKey(series);
              const pointCount = countSeriesPoints(chartPoints, series);

              return (
                <Line
                  key={series}
                  type="monotone"
                  dataKey={dataKey}
                  stroke={`var(--color-${dataKey})`}
                  strokeWidth={2.4}
                  connectNulls={false}
                  dot={{
                    r: pointCount < 2 ? 3 : 2.25,
                    fill: `var(--color-${dataKey})`,
                    stroke: "rgba(0,0,0,0)",
                  }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ChartContainer>

        {fullChartSeries.every((series) => countSeriesPoints(chartPoints, series) < 2) ? (
          <p className="text-sm text-zinc-400">
            Only one saved reading is available so far.
          </p>
        ) : null}
      </div>
    </div>
  );
}
