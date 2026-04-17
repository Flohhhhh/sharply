"use client";

import { useMemo } from "react";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "~/components/ui/chart";
import type {
  ExifTrackedCameraHistoryEntry,
  ExifTrackingChartSeries,
} from "../types";
import {
  buildExifTrackingChartPoints,
  countSeriesPoints,
  getSeriesDomain,
  resolveMiniChartSeries,
} from "./exif-tracking-chart-utils";

type ExifTrackingMiniChartProps = {
  readings: ExifTrackedCameraHistoryEntry[];
  className?: string;
};

const MINI_CHART_CONFIG: ChartConfig = {
  totalCountValue: {
    label: "Total shutter count",
    color: "#a3e635",
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

function getMiniChartDataKey(series: ExifTrackingChartSeries) {
  switch (series) {
    case "total":
      return "totalCountValue";
    case "mechanical":
      return "mechanicalCountValue";
    case "generic":
      return "genericCountValue";
  }
}

export default function ExifTrackingMiniChart({
  readings,
  className,
}: ExifTrackingMiniChartProps) {
  const chartPoints = useMemo(
    () => buildExifTrackingChartPoints(readings),
    [readings],
  );
  const selectedSeries = useMemo(
    () => resolveMiniChartSeries(chartPoints),
    [chartPoints],
  );

  if (!selectedSeries) {
    return null;
  }

  if (countSeriesPoints(chartPoints, selectedSeries) < 2) {
    return null;
  }

  const dataKey = getMiniChartDataKey(selectedSeries);
  const domain = getSeriesDomain(chartPoints, selectedSeries);

  return (
    <ChartContainer
      config={MINI_CHART_CONFIG}
      className={className}
    >
      <LineChart
        accessibilityLayer={false}
        data={chartPoints}
        margin={{ top: 4, right: 2, bottom: 4, left: 2 }}
      >
        <XAxis
          hide
          type="number"
          dataKey="plottedAtMs"
          scale="time"
          domain={["dataMin", "dataMax"]}
        />
        {domain ? <YAxis hide domain={domain} /> : null}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={`var(--color-${dataKey})`}
          strokeWidth={2.25}
          dot={{
            r: 1.75,
            fill: `var(--color-${dataKey})`,
            stroke: "rgba(0,0,0,0)",
          }}
          activeDot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
