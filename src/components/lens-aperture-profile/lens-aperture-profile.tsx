"use client";

import { Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ChartContainer, type ChartConfig } from "~/components/ui/chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { translateGearDetailWithFallback } from "~/lib/i18n/gear-detail";
import {
  apertureProfileColor,
  apertureProfileSegmentColor,
  formatApertureProfileNumber,
  type ApertureProfilePoint,
} from "~/lib/lens-aperture-profile";

const chartConfig: ChartConfig = { aperture: { label: "Maximum aperture", color: "#84cc16" } };
const PROFILE_FALLBACKS: Record<string, string> = {
  label: "Variable Aperture Profile",
  viewDetails: "View profile details",
  expand: "Expand",
};

export function LensApertureProfile({
  points,
  label,
  detailsLabel,
  className,
  barClassName,
  expandable = true,
}: {
  points: ApertureProfilePoint[];
  label?: string;
  detailsLabel?: string;
  className?: string;
  barClassName?: string;
  expandable?: boolean;
}) {
  const gearT = useTranslations("gearDetail");
  const t = (key: string) =>
    translateGearDetailWithFallback(
      gearT,
      `editGear.apertureProfile.${key}`,
      PROFILE_FALLBACKS[key] ?? key,
    );
  const [open, setOpen] = useState(false);
  const gradientId = `aperture-profile-line-${useId().replace(/:/g, "")}`;
  if (points.length < 3) return null;
  const resolvedLabel = label ?? t("label");
  const resolvedDetailsLabel = detailsLabel ?? t("viewDetails");
  const widestAperture = Math.min(...points.map((point) => point.aperture));
  const narrowestAperture = Math.max(...points.map((point) => point.aperture));
  const focalRange = points.at(-1)!.focalLength - points[0]!.focalLength;
  const focalPadding = Math.max(0.1, focalRange * 0.03);
  const aperturePadding = Math.max(
    0.1,
    (narrowestAperture - widestAperture) * 0.08,
  );
  const yDomain: [number, number] = [
    Math.max(0.1, widestAperture - aperturePadding),
    narrowestAperture + aperturePadding,
  ];
  const apertureTicks = Array.from(
    new Set(points.map((point) => point.aperture)),
  ).sort((a, b) => a - b);
  const compactContent = <>
      <span className="sr-only">{resolvedDetailsLabel}</span>
      <div className={`space-y-1 ${expandable ? "transition-opacity group-hover:opacity-25" : ""}`}>
        <div className="relative h-4 text-[10px] font-medium text-foreground">
          {points.map((point, index) => {
            const position = `${((point.focalLength - points[0]!.focalLength) / (points.at(-1)!.focalLength - points[0]!.focalLength)) * 100}%`;
            const endpointClass =
              index === 0
                ? "left-0 text-left"
                : index === points.length - 1
                  ? "right-0 text-right"
                  : "-translate-x-1/2";
            return <span key={point.focalLength} className={`absolute top-0 whitespace-nowrap ${endpointClass}`} style={index === 0 || index === points.length - 1 ? undefined : { left: position }}>
              {formatApertureProfileNumber(point.focalLength)}mm
            </span>;
          })}
        </div>
        <div className={`relative flex gap-px overflow-hidden rounded-md border bg-background ${barClassName ?? "h-10"}`}>
          {points.slice(0, -1).map((point, index) => {
          const next = points[index + 1]!;
          return <div key={point.focalLength} className="relative flex min-w-0 basis-0 items-center justify-center text-xs font-semibold text-foreground" style={{ flexGrow: next.focalLength - point.focalLength, backgroundColor: apertureProfileSegmentColor(index, points.length - 1) }}>
            f/{formatApertureProfileNumber(point.aperture)}
          </div>;
        })}
        </div>
      </div>
      {expandable ? <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm font-bold tracking-wide text-foreground opacity-0 transition-opacity group-hover:opacity-100">
        {t("expand")}
      </span> : null}
  </>;
  return <>
    {expandable ? <button type="button" onClick={() => setOpen(true)} className={`group relative w-full cursor-pointer rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`}>
      {compactContent}
    </button> : <div className={className}>{compactContent}</div>}
    {expandable ? <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader><DialogTitle>{resolvedLabel}</DialogTitle></DialogHeader>
        <ChartContainer
          config={chartConfig}
          className="h-80 w-full [--aperture-line-opacity:0.72] dark:[--aperture-line-opacity:1]"
        >
          <LineChart data={points} margin={{ top: 12, right: 24, bottom: 8, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={apertureProfileColor(widestAperture, points, 1)} stopOpacity="var(--aperture-line-opacity)" />
                <stop offset="100%" stopColor={apertureProfileColor(narrowestAperture, points, 1)} stopOpacity="var(--aperture-line-opacity)" />
              </linearGradient>
            </defs>
            {apertureTicks.map((aperture) => (
              <ReferenceLine
                key={`aperture-grid-${aperture}`}
                y={aperture}
                style={{ stroke: "var(--foreground)", strokeOpacity: 0.2 }}
                strokeDasharray="3 3"
              />
            ))}
            {points.slice(0, -1).map((point) => (
              <ReferenceLine
                key={`focal-grid-${point.focalLength}`}
                x={point.focalLength}
                style={{ stroke: "var(--foreground)", strokeOpacity: 0.2 }}
                strokeDasharray="3 3"
              />
            ))}
            <XAxis type="number" dataKey="focalLength" domain={[points[0]!.focalLength - focalPadding, points.at(-1)!.focalLength + focalPadding]} ticks={points.map((point) => point.focalLength)} tickFormatter={(value) => `${value}mm`} />
            <YAxis dataKey="aperture" reversed domain={yDomain} ticks={apertureTicks} tickFormatter={(value) => `f/${value}`} width={48} />
            <Line type="monotone" dataKey="aperture" stroke={`url(#${gradientId})`} strokeWidth={3} dot={{ r: 4, fill: "var(--foreground)", stroke: "var(--background)", strokeWidth: 2 }} activeDot={{ r: 6, fill: "var(--foreground)", stroke: "var(--background)", strokeWidth: 2 }} />
          </LineChart>
        </ChartContainer>
      </DialogContent>
    </Dialog> : null}
  </>;
}
