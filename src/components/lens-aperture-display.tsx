"use client";

import { cn } from "~/lib/utils";

export interface LensApertureDisplayProps {
  maxApertureWide: number | null | undefined;
  minApertureWide: number | null | undefined;
  maxApertureTele?: number | null | undefined;
  minApertureTele?: number | null | undefined;
  className?: string;
}

function trimZeros(n: number | null | undefined): string {
  if (n == null) return "";
  // toFixed(2) due to DB precision; then strip trailing zeros and dot
  return Number(n)
    .toFixed(2)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

function formatApertureSingle(n: number | null | undefined): string {
  const s = trimZeros(n);
  return s ? `f/${s}` : "";
}

function formatApertureRange(
  wide: number | null | undefined,
  tele: number | null | undefined,
): string {
  const a = trimZeros(wide);
  const b = trimZeros(tele);
  if (!a && !b) return "";
  if (!b || a === b) return `f/${a}`;
  if (!a) return `f/${b}`; // fallback if only tele provided
  return `f/${a} - ${b}`;
}

export default function LensApertureDisplay({
  maxApertureWide,
  minApertureWide,
  maxApertureTele,
  minApertureTele,
  className = "",
}: LensApertureDisplayProps) {
  const maxText = formatApertureRange(maxApertureWide ?? null, maxApertureTele);
  const minText = formatApertureRange(minApertureWide ?? null, minApertureTele);

  if (!maxText && !minText) return null;

  return (
    <div className={cn("space-y-1", className)}>
      {maxText ? (
        <div className="text-sm">
          <span className="text-muted-foreground">Maximum Aperture:</span>{" "}
          <span className="font-medium">{maxText}</span>
        </div>
      ) : null}
      {minText ? (
        <div className="text-sm">
          <span className="text-muted-foreground">Minimum Aperture:</span>{" "}
          <span className="font-medium">{minText}</span>
        </div>
      ) : null}
    </div>
  );
}
