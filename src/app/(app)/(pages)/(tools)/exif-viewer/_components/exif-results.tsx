"use client";

import NumberFlow, { continuous } from "@number-flow/react";
import { RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import type {
  ExifViewerMetadataRow,
  ExifViewerResponse,
} from "../types";
import ExifMetadataTable from "./exif-metadata-table";
import { TooltipContent, Tooltip, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";

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
  const trimmedModel = model?.trim() || null;
  const trimmedMake = make?.trim() || null;

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

function findCameraSerialNumber(rows: ExifViewerMetadataRow[]): string {
  return formatDisplayValue(
    findMetadataValue(rows, [
      "MakerNotes:SerialNumber",
      "MakerNotes:InternalSerialNumber",
      "MakerNotes:CameraSerialNumber",
      "EXIF:SerialNumber",
      "ExifIFD:SerialNumber",
      "Composite:SerialNumber",
      "Nikon:SerialNumber",
      "Canon:SerialNumber",
      "Sony:SerialNumber",
      "FujiFilm:SerialNumber",
    ]),
  );
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
      value: formatIso(
        findMetadataValue(rows, [
          "EXIF:ISO",
          "ExifIFD:ISO",
          "Composite:ISO",
        ]),
      ),
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
      plugins={[continuous]}
      format={{ useGrouping: true }}
      transformTiming={{
        duration: 1_250,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      spinTiming={{
        duration: 1000,
        easing: "linear(0, 0.0012 0.47%, 0.0061 1.09%, 0.0264, 0.0581 3.59%, 0.1043 4.99%, 0.212 7.65%, 0.4614 13.11%, 0.5758, 0.6782, 0.7662, 0.8393, 0.8979 26.37%, 0.9454 29.18%, 0.9642 30.58%, 0.9816 32.14%, 1.0027 34.64%, 1.0183 37.45%, 1.0278 40.57%, 1.0314 44%, 1.0291 49%, 1.0105 62.89%, 1.0028 71.78%, 0.9994 82.55%, 0.9993 99.87%)",
      }}
      opacityTiming={{ duration: 360, easing: "ease-out" }}

      willChange
    />
  );
}

type ExifResultsProps = {
  result: ExifViewerResponse;
  isLoggedIn: boolean;
  onStartOver: () => void;
};

export default function ExifResults({
  result,
  isLoggedIn,
  onStartOver,
}: ExifResultsProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const heroMetric = useMemo(() => resolveHeroMetric(result), [result]);
  const summaryItems = useMemo(() => buildSummaryItems(result), [result]);
  const cameraModel = summaryItems[0]?.value || EMPTY_VALUE;
  const cameraSerialNumber = useMemo(
    () => findCameraSerialNumber(result.metadata.rows),
    [result.metadata.rows],
  );

  return (
    <div className="space-y-2">
      <motion.section
        className="flex flex-col items-center py-4 text-center"
        {...getEnterAnimation(reduceMotion)}
      >
        {heroMetric ? (
          <motion.div
            className="flex flex-col gap-4 items-center"
            {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.1)}
          >
            <div className="flex flex-col gap-2 items-center">
              <AnimatedCount
                value={heroMetric.value}
                className="text-foreground text-6xl font-semibold tracking-tight tabular-nums sm:text-8xl my-0 py-0 leading-0"
              />
              <p className="text-muted-foreground -mt-6">
                {heroMetric.label}
              </p>
            </div>

            {heroMetric.secondaryValue !== null &&
              heroMetric.secondaryLabel !== null ? (
              <div className="space-y-2">
                <p className="text-3xl font-semibold tabular-nums">
                  {heroMetric.secondaryValue.toLocaleString()}
                </p>
                <p className="text-muted-foreground">
                  {heroMetric.secondaryLabel}
                </p>
              </div>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            className="max-w-lg rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm"
            {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.1)}
          >
            {result.message}
          </motion.div>
        )}
      </motion.section>

      {/* controls section */}
      <motion.div
        className="flex justify-end mt-8"
        {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.08)}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<RotateCcw />}
          onClick={onStartOver}
        >
          Start Over
        </Button>
      </motion.div>

      <motion.section
        className="rounded-xl border border-white/10 p-2 sm:p-4 "
        {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.1)}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="">
            <p className="text-sm">{cameraModel}</p>
            <p className="text-muted-foreground text-sm">
              {cameraSerialNumber}
            </p>
          </div>
          {!isLoggedIn ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* #TODO: add tracking for exif */}
                  <span className="inline-flex">
                    <Button type="button" disabled size="sm">
                      Log in to track
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      </motion.section>

      {/* summary section */}
      <motion.section
        className="rounded-xl border border-white/10 p-2 sm:p-4"
        {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.12)}
      >
        <dl className="grid gap-x-10 gap-y-4 md:grid-cols-2">
          {summaryItems.map((item) => (
            <motion.div
              key={item.label}
              className="space-y-1"
              {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.16)}
            >
              <dt className="text-muted-foreground text-sm">
                {item.label}
              </dt>
              <dd className="text-sm">{item.value}</dd>
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
