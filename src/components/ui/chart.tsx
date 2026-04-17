"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "~/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("Chart components must be used inside <ChartContainer />.");
  }

  return context;
}

function ChartStyle({
  id,
  config,
}: {
  id: string;
  config: ChartConfig;
}) {
  const colorEntries = Object.entries(config).filter(
    ([, item]) => item.color,
  ) as Array<[string, { color: string; label?: React.ReactNode }]>;

  if (colorEntries.length === 0) {
    return null;
  }

  const cssVariables = colorEntries
    .map(([key, item]) => `  --color-${key}: ${item.color};`)
    .join("\n");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart="${id}"] {\n${cssVariables}\n}`,
      }}
    />
  );
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId().replace(/:/g, "");
  const chartId = `chart-${id ?? uniqueId}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-chart={chartId}
        className={cn(
          "text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-white/8 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-white/15 [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-legend-item-text]:text-muted-foreground [&_.recharts-reference-line_line]:stroke-white/10",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

export const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipContentProps = React.ComponentProps<"div"> & {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    name?: string;
    value?: number | string;
  }>;
  label?: React.ReactNode;
  hideLabel?: boolean;
  formatter?: (value: number | string, name: string) => React.ReactNode;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  formatter,
  className,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid min-w-[180px] gap-2 rounded-lg border border-white/10 bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm",
        className,
      )}
    >
      {!hideLabel ? <div className="font-medium text-foreground">{label}</div> : null}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "");
          const configItem = config[key];
          const displayName =
            typeof configItem?.label === "string" || typeof configItem?.label === "number"
              ? String(configItem.label)
              : item.name ?? key;

          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: item.color ?? configItem?.color ?? "currentColor",
                  }}
                />
                <span className="text-muted-foreground">{displayName}</span>
              </div>
              <span className="font-medium text-foreground">
                {formatter
                  ? formatter(
                      typeof item.value === "number" || typeof item.value === "string"
                        ? item.value
                        : "",
                      displayName,
                    )
                  : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ChartLegend = RechartsPrimitive.Legend;

type ChartLegendContentProps = React.ComponentProps<"div"> & {
  payload?: Array<{
    color?: string;
    dataKey?: string;
    value?: string;
  }>;
};

export function ChartLegendContent({
  payload,
  className,
}: ChartLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-4 text-xs", className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.value ?? "");
        const configItem = config[key];
        const displayName =
          typeof configItem?.label === "string" || typeof configItem?.label === "number"
            ? String(configItem.label)
            : item.value ?? key;

        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{
                backgroundColor: item.color ?? configItem?.color ?? "currentColor",
              }}
            />
            <span className="text-muted-foreground">{displayName}</span>
          </div>
        );
      })}
    </div>
  );
}

