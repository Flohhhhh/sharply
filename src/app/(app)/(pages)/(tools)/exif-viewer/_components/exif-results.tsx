"use client";

import NumberFlow from "@number-flow/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type {
  ExifViewerMetadataRow,
  ExifViewerResponse,
} from "../types";
import ExifMetadataTable from "./exif-metadata-table";

type ExifSummaryItem = {
  label: string;
  value: string;
};

type ExifHeroMetric = {
  label: string;
  value: number;
  secondaryLabel: string | null;
  secondaryValue: number | null;
};

const EMPTY_VALUE = "—";

function findMetadataValue(
  rows: ExifViewerMetadataRow[],
  candidateKeys: string[],
): string | null {
  const matches = new Set(candidateKeys.map((key) => key.toLowerCase()));
  const match = rows.find((row) => matches.has(row.key.toLowerCase()));
  const value = match?.value.trim();
  return value ? value : null;
}

function formatCameraLabel(
  make: string | null | undefined,
  model: string | null | undefined,
): string | null {
  const trimmedMake = make?.trim() || null;
  const trimmedModel = model?.trim() || null;

  if (trimmedMake && trimmedModel) {
    if (trimmedModel.toLowerCase().startsWith(trimmedMake.toLowerCase())) {
      return trimmedModel;
    }

    return `${trimmedMake} ${trimmedModel}`;
  }

  return trimmedModel ?? trimmedMake ?? null;
}

function formatCaptureDate(value: string | null): string {
  if (!value) return EMPTY_VALUE;

  const normalized = value.replace(
    /^(\d{4}):(\d{2}):(\d{2})\s/,
    "$1-$2-$3T",
  );
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatAperture(value: string | null): string {
  if (!value) return EMPTY_VALUE;
  if (/^f\//i.test(value)) return value;
  if (/^\d+(\.\d+)?$/.test(value)) return `f/${value}`;
  return value;
}

function formatIso(value: string | null): string {
  if (!value) return EMPTY_VALUE;
  return /^iso\s+/i.test(value) ? value : `ISO ${value}`;
}

function formatDisplayValue(value: string | null): string {
  return value?.trim() || EMPTY_VALUE;
}

function getEnterAnimation(
  reduceMotion: boolean,
  delay = 0,
) {
  return {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: {
      duration: reduceMotion ? 0.2 : 0.42,
      delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  };
}

export function getNumberFlowSeed(value: number): number {
  const digitCount = Math.abs(value).toString().length;
  return digitCount > 1 ? 10 ** (digitCount - 1) : 0;
}

export function resolveHeroMetric(
  result: ExifViewerResponse,
): ExifHeroMetric | null {
  const {
    shutterCount,
    totalShutterCount,
    mechanicalShutterCount,
    selected,
  } = result.extractor;

  if (
    selected === "generic" &&
    shutterCount !== null &&
    mechanicalShutterCount === null
  ) {
    return {
      label: "Shutter Count",
      value: shutterCount,
      secondaryLabel: null,
      secondaryValue: null,
    };
  }

  if (totalShutterCount !== null) {
    return {
      label: "Total Shutter Count",
      value: totalShutterCount,
      secondaryLabel:
        mechanicalShutterCount !== null ? "Mechanical Shutter Count" : null,
      secondaryValue: mechanicalShutterCount,
    };
  }

  if (mechanicalShutterCount !== null) {
    return {
      label: "Mechanical Shutter Count",
      value: mechanicalShutterCount,
      secondaryLabel: null,
      secondaryValue: null,
    };
  }

  if (shutterCount !== null) {
    return {
      label: "Shutter Count",
      value: shutterCount,
      secondaryLabel: null,
      secondaryValue: null,
    };
  }

  return null;
}

export function buildSummaryItems(
  result: ExifViewerResponse,
): ExifSummaryItem[] {
  const rows = result.metadata.rows;
  const fallbackCameraLabel = formatCameraLabel(
    findMetadataValue(rows, ["EXIF:Make", "IFD0:Make"]),
    findMetadataValue(rows, ["EXIF:Model", "IFD0:Model"]),
  );

  return [
    {
      label: "Camera Model",
      value:
        formatCameraLabel(result.camera.make, result.camera.model) ??
        fallbackCameraLabel ??
        EMPTY_VALUE,
    },
    {
      label: "Lens",
      value: formatDisplayValue(
        findMetadataValue(rows, [
          "Composite:LensID",
          "EXIF:LensModel",
          "Composite:LensSpec",
          "MakerNotes:Lens",
        ]),
      ),
    },
    {
      label: "Capture Date",
      value: formatCaptureDate(
        findMetadataValue(rows, [
          "Composite:SubSecDateTimeOriginal",
          "EXIF:DateTimeOriginal",
          "EXIF:CreateDate",
        ]),
      ),
    },
    {
      label: "Exposure Time",
      value: formatDisplayValue(
        findMetadataValue(rows, [
          "Composite:ShutterSpeed",
          "EXIF:ExposureTime",
        ]),
      ),
    },
    {
      label: "Aperture",
      value: formatAperture(
        findMetadataValue(rows, ["Composite:Aperture", "EXIF:FNumber"]),
      ),
    },
    {
      label: "ISO",
      value: formatIso(findMetadataValue(rows, ["EXIF:ISO", "Composite:ISO"])),
    },
  ];
}

type AnimatedCountProps = {
  value: number;
  className?: string;
};

function AnimatedCount({ value, className }: AnimatedCountProps) {
  const reduceMotion = useReducedMotion();
  const [displayedValue, setDisplayedValue] = useState<number>(() =>
    reduceMotion ? value : getNumberFlowSeed(value),
  );

  useEffect(() => {
    if (reduceMotion) {
      setDisplayedValue(value);
      return;
    }

    const seed = getNumberFlowSeed(value);
    setDisplayedValue(seed);

    const frameId = window.requestAnimationFrame(() => {
      setDisplayedValue(value);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [reduceMotion, value]);

  return (
    <NumberFlow
      value={displayedValue}
      className={className}
      format={{ useGrouping: true }}
      transformTiming={{
        duration: 1_250,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      spinTiming={{
        duration: 1_250,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      opacityTiming={{ duration: 360, easing: "ease-out" }}
      willChange
    />
  );
}

type ExifResultsProps = {
  result: ExifViewerResponse;
};

export default function ExifResults({ result }: ExifResultsProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const heroMetric = useMemo(() => resolveHeroMetric(result), [result]);
  const summaryItems = useMemo(() => buildSummaryItems(result), [result]);
  const cameraLabel = summaryItems[0]?.value || EMPTY_VALUE;

  return (
    <div className="space-y-8">
      <motion.section
        className="flex flex-col items-center gap-3 py-4 text-center"
        {...getEnterAnimation(reduceMotion)}
      >
        <motion.p
          className="text-muted-foreground text-sm sm:text-base"
          {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.04)}
        >
          {cameraLabel}
        </motion.p>

        {heroMetric ? (
          <>
            <motion.div {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.1)}>
              <AnimatedCount
                value={heroMetric.value}
                className="text-foreground text-6xl font-semibold tracking-tight tabular-nums sm:text-8xl"
              />
            </motion.div>
            <motion.p
              className="text-muted-foreground text-sm font-medium"
              {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.14)}
            >
              {heroMetric.label}
            </motion.p>
            {heroMetric.secondaryValue !== null &&
            heroMetric.secondaryLabel !== null ? (
              <motion.div
                className="pt-3"
                {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.2)}
              >
                <p className="text-lg font-semibold tabular-nums">
                  {heroMetric.secondaryValue.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-xs">
                  {heroMetric.secondaryLabel}
                </p>
              </motion.div>
            ) : null}
          </>
        ) : (
          <motion.div
            className="max-w-lg rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm"
            {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.1)}
          >
            {result.message}
          </motion.div>
        )}
      </motion.section>

      <motion.section
        className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6"
        {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.12)}
      >
        <dl className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {summaryItems.map((item) => (
            <motion.div
              key={item.label}
              className="space-y-1.5"
              {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.16)}
            >
              <dt className="text-muted-foreground text-sm">
                {item.label}
              </dt>
              <dd className="text-base font-semibold">{item.value}</dd>
            </motion.div>
          ))}
        </dl>
      </motion.section>

      <motion.div {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.18)}>
        <ExifMetadataTable rows={result.metadata.rows} />
      </motion.div>
    </div>
  );
}
