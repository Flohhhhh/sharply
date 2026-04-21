"use client";

import NumberFlow, { continuous } from "@number-flow/react";
import { RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Button } from "~/components/ui/button";
import type {
  ExifTrackedCameraHistoryEntry,
  ExifTrackingDeleteResponse,
  ExifTrackingHistoryResponse,
  ExifTrackingSaveResponse,
  ExifViewerMetadataRow,
  ExifViewerResponse,
} from "../types";
import {
  EXIF_VIEWER_CAPTURE_DATE_CANDIDATE_KEYS,
  EXIF_VIEWER_SERIAL_CANDIDATE_KEYS,
} from "../types";
import ExifMetadataTable from "./exif-metadata-table";
import ExifTrackingMiniChart from "./exif-tracking-mini-chart";
import ExifTrackingHistoryDialog from "./exif-tracking-history-dialog";
import { formatDate } from "~/lib/format/date";

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

type ExifReadingIdentity = {
  captureAt: string | null;
  primaryCountType: ExifTrackedCameraHistoryEntry["primaryCountType"];
  primaryCountValue: number;
};

const EMPTY_VALUE = "—";

function findMetadataValue(
  rows: ExifViewerMetadataRow[],
  candidateKeys: readonly string[],
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

function formatCaptureDate(value: string | null, locale = "en"): string {
  if (!value) return EMPTY_VALUE;

  const normalized = value.replace(/^(\d{4}):(\d{2}):(\d{2})\s/, "$1-$2-$3T");
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatDate(parsed, {
    locale,
    preset: "datetime-short",
    timeZone: "local",
    fallback: value,
  });
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

function normalizeCaptureAtValue(value: string | null): string | null {
  if (!value) return null;

  const normalized = value.replace(/^(\d{4}):(\d{2}):(\d{2})\s/, "$1-$2-$3T");
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function findCameraSerialNumber(rows: ExifViewerMetadataRow[]): string {
  return formatDisplayValue(
    findMetadataValue(rows, EXIF_VIEWER_SERIAL_CANDIDATE_KEYS),
  );
}

function resolveCurrentReadingIdentity(
  result: ExifViewerResponse,
): ExifReadingIdentity | null {
  const primaryCount =
    result.extractor.totalShutterCount !== null
      ? {
          primaryCountType: "total" as const,
          primaryCountValue: result.extractor.totalShutterCount,
        }
      : result.extractor.mechanicalShutterCount !== null
        ? {
            primaryCountType: "mechanical" as const,
            primaryCountValue: result.extractor.mechanicalShutterCount,
          }
        : result.extractor.shutterCount !== null
          ? {
              primaryCountType: "generic" as const,
              primaryCountValue: result.extractor.shutterCount,
            }
          : null;

  if (!primaryCount) {
    return null;
  }

  return {
    ...primaryCount,
    captureAt: normalizeCaptureAtValue(
      findMetadataValue(
        result.metadata.rows,
        EXIF_VIEWER_CAPTURE_DATE_CANDIDATE_KEYS,
      ),
    ),
  };
}

function isMatchingReading(
  currentReading: ExifReadingIdentity | null,
  reading: ExifTrackedCameraHistoryEntry,
) {
  if (!currentReading) {
    return false;
  }

  return (
    currentReading.primaryCountType === reading.primaryCountType &&
    currentReading.primaryCountValue === reading.primaryCountValue &&
    currentReading.captureAt === reading.captureAt
  );
}

function getEnterAnimation(reduceMotion: boolean, delay = 0) {
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
  const { shutterCount, totalShutterCount, mechanicalShutterCount, selected } =
    result.extractor;

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
  locale = "en",
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
        locale,
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
        findMetadataValue(rows, ["EXIF:ISO", "ExifIFD:ISO", "Composite:ISO"]),
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
        easing:
          "linear(0, 0.0012 0.47%, 0.0061 1.09%, 0.0264, 0.0581 3.59%, 0.1043 4.99%, 0.212 7.65%, 0.4614 13.11%, 0.5758, 0.6782, 0.7662, 0.8393, 0.8979 26.37%, 0.9454 29.18%, 0.9642 30.58%, 0.9816 32.14%, 1.0027 34.64%, 1.0183 37.45%, 1.0278 40.57%, 1.0314 44%, 1.0291 49%, 1.0105 62.89%, 1.0028 71.78%, 0.9994 82.55%, 0.9993 99.87%)",
      }}
      opacityTiming={{ duration: 360, easing: "ease-out" }}
      willChange
    />
  );
}

type ExifResultsProps = {
  result: ExifViewerResponse;
  initialHistoryData: ExifTrackingHistoryResponse | null;
  onStartOver: () => void;
};

function formatTrackingSummary(result: ExifViewerResponse) {
  const trackedCamera = result.tracking.trackedCamera;
  if (!trackedCamera) return null;

  // const latestCount =
  //   trackedCamera.latestPrimaryCountValue !== null
  //     ? `Latest ${trackedCamera.latestPrimaryCountValue.toLocaleString()}`
  //     : null;
  const readingCount = `${trackedCamera.readingCount} saved reading${trackedCamera.readingCount === 1 ? "" : "s"}`;

  // return [readingCount, latestCount].filter(Boolean).join(" · ");
  return readingCount;
}

function getTrackingUnavailableMessage(result: ExifViewerResponse) {
  switch (result.tracking.reason) {
    case "missing_serial":
      return "Tracking requires a serial number.";
    case "missing_count":
      return "Tracking requires a shutter count.";
    case "unsupported_result":
      return "Tracking is unavailable for this result.";
    default:
      return "Tracking is unavailable.";
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.text();

  try {
    return JSON.parse(body) as T;
  } catch {
    if (body.trim().startsWith("<")) {
      throw new Error("Request returned HTML instead of JSON.");
    }

    throw new Error("Request returned an invalid JSON response.");
  }
}

export default function ExifResults({
  result,
  initialHistoryData,
  onStartOver,
}: ExifResultsProps) {
  const locale = useLocale();
  const reduceMotion = Boolean(useReducedMotion());
  const heroMetric = useMemo(() => resolveHeroMetric(result), [result]);
  const summaryItems = useMemo(
    () => buildSummaryItems(result, locale),
    [locale, result],
  );
  const cameraModel = summaryItems[0]?.value || EMPTY_VALUE;
  const cameraSerialNumber = useMemo(
    () => findCameraSerialNumber(result.metadata.rows),
    [result.metadata.rows],
  );
  const currentReadingIdentity = useMemo(
    () => resolveCurrentReadingIdentity(result),
    [result],
  );
  const suppressedAutoSaveTokensRef = useRef(new Set<string>());
  const backgroundHistoryRequestedIdsRef = useRef(new Set<string>());
  const [trackingState, setTrackingState] = useState(result.tracking);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] =
    useState<ExifTrackingHistoryResponse | null>(initialHistoryData);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [deletingReadingId, setDeletingReadingId] = useState<string | null>(
    null,
  );
  const signInHref = `/auth/signin?callbackUrl=${encodeURIComponent("/exif-viewer")}`;
  const trackedHistoryData =
    trackingState.trackedCamera &&
    historyData?.trackedCamera?.id === trackingState.trackedCamera.id
      ? historyData
      : null;

  useEffect(() => {
    suppressedAutoSaveTokensRef.current.clear();
    backgroundHistoryRequestedIdsRef.current.clear();
    setTrackingState(result.tracking);
    setSaveError(null);
    setHistoryOpen(false);
    setHistoryData(initialHistoryData);
    setHistoryError(null);
    setIsHistoryLoading(false);
    setDeletingReadingId(null);
  }, [initialHistoryData, result]);

  async function handleSaveTracking(tokenOverride?: string) {
    const saveToken = tokenOverride ?? trackingState.saveToken;
    if (!saveToken || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/exif-tracking/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: saveToken,
        }),
      });
      const payload =
        await readJsonResponse<ExifTrackingSaveResponse>(response);

      if (!response.ok || !payload.ok || !payload.tracking) {
        throw new Error(
          payload.message || "Failed to save EXIF tracking history.",
        );
      }

      setTrackingState(payload.tracking);

      if (payload.tracking.trackedCamera) {
        await loadHistory(payload.tracking.trackedCamera.id, {
          silent: true,
        });
      }
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save EXIF tracking history.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    const trackedCameraId = trackingState.trackedCamera?.id;

    if (
      !trackedCameraId ||
      trackedHistoryData ||
      isHistoryLoading ||
      backgroundHistoryRequestedIdsRef.current.has(trackedCameraId)
    ) {
      return;
    }

    backgroundHistoryRequestedIdsRef.current.add(trackedCameraId);
    void loadHistory(trackedCameraId, {
      silent: true,
    });
  }, [isHistoryLoading, trackedHistoryData, trackingState.trackedCamera]);

  async function loadHistory(
    trackedCameraId: string,
    options?: { silent?: boolean },
  ) {
    setIsHistoryLoading(true);

    if (!options?.silent) {
      setHistoryError(null);
    }

    try {
      const response = await fetch(
        `/api/exif-tracking/cameras/${trackedCameraId}/history`,
      );
      const payload = await readJsonResponse<
        ExifTrackingHistoryResponse & {
          message?: string;
        }
      >(response);

      if (!response.ok || !payload.ok || !payload.trackedCamera) {
        throw new Error(payload.message || "Failed to load tracking history.");
      }

      setHistoryData(payload);
    } catch (error) {
      if (!options?.silent) {
        setHistoryError(
          error instanceof Error
            ? error.message
            : "Failed to load tracking history.",
        );
      }
    } finally {
      setIsHistoryLoading(false);
    }
  }

  async function handleHistoryOpenChange(open: boolean) {
    setHistoryOpen(open);

    if (!open || !trackingState.trackedCamera) {
      return;
    }

    if (
      historyData?.trackedCamera?.id === trackingState.trackedCamera.id &&
      !historyError
    ) {
      return;
    }

    await loadHistory(trackingState.trackedCamera.id);
  }

  function handleTrackedBannerActivate() {
    if (!trackingState.trackedCamera) {
      return;
    }

    void handleHistoryOpenChange(true);
  }

  async function handleDeleteReading(readingId: string) {
    const readingToDelete =
      historyData?.readings.find((reading) => reading.id === readingId) ?? null;

    setDeletingReadingId(readingId);
    setHistoryError(null);

    try {
      const response = await fetch(`/api/exif-tracking/readings/${readingId}`, {
        method: "DELETE",
      });
      const payload =
        await readJsonResponse<ExifTrackingDeleteResponse>(response);

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.message || "Failed to delete EXIF tracking history.",
        );
      }

      const deletedCurrentReading =
        readingToDelete !== null &&
        isMatchingReading(currentReadingIdentity, readingToDelete);

      if (deletedCurrentReading && result.tracking.saveToken) {
        suppressedAutoSaveTokensRef.current.add(result.tracking.saveToken);
      }

      setTrackingState((currentTrackingState) => ({
        ...currentTrackingState,
        matchedGear: payload.matchedGear ?? currentTrackingState.matchedGear,
        trackedCamera: payload.trackedCamera,
        currentReadingSaved: deletedCurrentReading
          ? false
          : currentTrackingState.currentReadingSaved,
        saveToken: deletedCurrentReading
          ? result.tracking.saveToken
          : currentTrackingState.saveToken,
      }));

      if (!payload.trackedCamera) {
        setHistoryData(null);
        setHistoryOpen(false);
        return;
      }

      await loadHistory(payload.trackedCamera.id);
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Failed to delete saved reading.",
      );
    } finally {
      setDeletingReadingId(null);
    }
  }

  return (
    <div className="space-y-2">
      <motion.section
        className="flex flex-col items-center py-4 text-center"
        {...getEnterAnimation(reduceMotion)}
      >
        {heroMetric ? (
          <motion.div
            className="flex flex-col items-center gap-4"
            {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.1)}
          >
            <div className="flex flex-col items-center gap-2">
              <AnimatedCount
                value={heroMetric.value}
                className="text-foreground my-0 py-0 text-6xl leading-0 font-semibold tracking-tight tabular-nums sm:text-8xl"
              />
              <p className="text-muted-foreground -mt-6">{heroMetric.label}</p>
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
            className="border-border max-w-lg rounded-xl border bg-white/5 px-5 py-4 text-sm"
            {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.1)}
          >
            {result.message}
          </motion.div>
        )}
      </motion.section>

      {/* controls section */}
      <motion.div
        className="mt-8 flex justify-end"
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

      {/* tracked camera banner section */}
      <motion.section
        className={
          trackingState.trackedCamera
            ? "border-border hover:bg-muted/50 cursor-pointer rounded-xl border p-2 transition-colors focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:outline-none sm:p-4"
            : "border-border rounded-xl border p-2 sm:p-4"
        }
        role={trackingState.trackedCamera ? "button" : undefined}
        tabIndex={trackingState.trackedCamera ? 0 : undefined}
        onClick={
          trackingState.trackedCamera ? handleTrackedBannerActivate : undefined
        }
        onKeyDown={
          trackingState.trackedCamera
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleTrackedBannerActivate();
                }
              }
            : undefined
        }
        {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.1)}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm">{cameraModel}</p>
            <p className="text-muted-foreground text-sm">
              {cameraSerialNumber}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end">
            {trackingState.trackedCamera ? (
              <>
                <div className="relative h-12 w-[136px]">
                  {trackedHistoryData ? (
                    <ExifTrackingMiniChart
                      readings={trackedHistoryData.readings}
                      className="h-12 w-[136px] [mask-image:linear-gradient(to_right,transparent,white_12%,white_88%,transparent)]"
                    />
                  ) : (
                    <div className="h-12 w-[136px]" />
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {formatTrackingSummary({
                    ...result,
                    tracking: trackingState,
                  }) ?? "Tracking enabled"}
                </p>
              </>
            ) : (
              <>
                {!trackingState.eligible ? (
                  <p className="text-muted-foreground text-sm">
                    {getTrackingUnavailableMessage({
                      ...result,
                      tracking: trackingState,
                    })}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  {trackingState.reason === "not_signed_in" ? (
                    <Button type="button" size="sm" asChild>
                      <Link href={signInHref}>Log in to save history</Link>
                    </Button>
                  ) : null}

                  {trackingState.eligible &&
                  trackingState.saveToken &&
                  trackingState.reason !== "not_signed_in" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleSaveTracking()}
                      loading={isSaving}
                    >
                      Save to track
                    </Button>
                  ) : null}
                </div>
              </>
            )}

            {saveError ? (
              <p className="text-sm text-red-300">{saveError}</p>
            ) : null}
          </div>
        </div>
      </motion.section>

      {/* summary section */}
      <motion.section
        className="border-border rounded-xl border p-2 sm:p-4"
        {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.12)}
      >
        <dl className="grid gap-x-10 gap-y-4 md:grid-cols-2">
          {summaryItems.map((item) => (
            <motion.div
              key={item.label}
              className="space-y-1"
              {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.16)}
            >
              <dt className="text-muted-foreground text-sm">{item.label}</dt>
              <dd className="text-sm">{item.value}</dd>
            </motion.div>
          ))}
        </dl>
      </motion.section>

      <motion.div {...getEnterAnimation(reduceMotion, reduceMotion ? 0 : 0.18)}>
        <ExifMetadataTable rows={result.metadata.rows} />
      </motion.div>

      <ExifTrackingHistoryDialog
        open={historyOpen}
        onOpenChange={(open) => void handleHistoryOpenChange(open)}
        data={historyData}
        loading={isHistoryLoading}
        error={historyError}
        deletingReadingId={deletingReadingId}
        onDeleteReading={(readingId) => void handleDeleteReading(readingId)}
      />
    </div>
  );
}
