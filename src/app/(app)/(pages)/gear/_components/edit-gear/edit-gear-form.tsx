"use client";

import { track } from "@vercel/analytics";
import React, { useState, useCallback } from "react";
import { Crop } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { CoreFields } from "./fields-core";
import { LensFields } from "./fields-lenses";
import CameraFields from "./fields-cameras";
import type { GearType } from "~/types/gear";
import { AnalogCameraFields } from "./fields-analog-cameras";
import { FixedLensFields } from "./fields-fixed-lens";
import { NotesFields } from "~/app/(app)/(pages)/gear/_components/edit-gear/fields-notes";
import { MOUNTS } from "~/lib/generated";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatPrice, formatCardSlotDetails } from "~/lib/mapping";
import { sensorNameFromSlug } from "~/lib/mapping/sensor-map";
import { humanizeKey, formatHumanDate } from "~/lib/utils";
import { getMountLongNamesById } from "~/lib/mapping/mounts-map";
import { actionSubmitGearProposal } from "~/server/gear/actions";
import {
  videoModeInputSchema,
  normalizeVideoModes,
  type VideoModeInput,
  type VideoModeNormalized,
  videoModesEqual,
} from "~/lib/video/mode-schema";
import type { GearItem } from "~/types/gear";

const SHUTTER_LABELS: Record<string, string> = {
  mechanical: "Mechanical",
  efc: "EFCS",
  electronic: "Electronic",
};

function formatStorageValue(value: unknown): string {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return safeString(value);
  if (num >= 1000) {
    const tb = num / 1000;
    const formattedTb = Number.isInteger(tb) ? tb.toFixed(0) : tb.toFixed(1);
    return `${formattedTb} TB`;
  }
  const formattedGb = Number.isInteger(num) ? num.toFixed(0) : num.toFixed(1);
  return `${formattedGb} GB`;
}

function safeString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function formatFpsValue(value: unknown): string {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return String(value);
  return `${num} fps`;
}

function formatMaxFpsByShutter(value: unknown): string {
  if (!value || typeof value !== "object") return safeString(value);
  const entries: string[] = [];
  for (const [rawKey, rawEntry] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!rawEntry || typeof rawEntry !== "object") continue;
    const key = rawKey.toLowerCase();
    const label = SHUTTER_LABELS[key] ?? rawKey;
    const entryObj = rawEntry as { raw?: unknown; jpg?: unknown };
    const rawVal = entryObj.raw;
    const jpgVal = entryObj.jpg;
    const rawText = rawVal === undefined ? null : formatFpsValue(rawVal);
    const jpgText = jpgVal === undefined ? null : formatFpsValue(jpgVal);
    let combined = "";
    if (rawText && jpgText) {
      combined =
        rawText === jpgText ? rawText : `${rawText} (Raw), ${jpgText} (JPG)`;
    } else if (rawText) {
      combined = `${rawText} (Raw)`;
    } else if (jpgText) {
      combined = `${jpgText} (JPG)`;
    }
    if (combined.length === 0) continue;
    entries.push(`${label}: ${combined}`);
  }
  return entries.length ? entries.join("; ") : safeString(value);
}

interface EditGearFormProps {
  gearType?: GearType;
  gearSlug: string;
  gearData: GearItem;
  onDirtyChange?: (dirty: boolean) => void;
  onRequestClose?: (opts?: { force?: boolean }) => void;
  onSubmittingChange?: (submitting: boolean) => void;
  showActions?: boolean;
  formId?: string;
  showMissingOnly?: boolean; // Controls filtering of fields based on initial values
  onFormDataChange?: (data: GearItem) => void;
}

function EditGearForm({
  gearType,
  gearData,
  gearSlug,
  onDirtyChange,
  onRequestClose,
  onSubmittingChange,
  showActions = true,
  formId,
  showMissingOnly,
  onFormDataChange,
}: EditGearFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<GearItem>(gearData);
  const [diffPreview, setDiffPreview] = useState<Record<string, any> | null>(
    null,
  );
  type VideoModesDiff = {
    added: VideoModeNormalized[];
    removed: VideoModeNormalized[];
    changed: Array<{ prev: VideoModeNormalized; next: VideoModeNormalized }>;
  };
  const videoModesDiffRef = React.useRef<VideoModesDiff>({
    added: [],
    removed: [],
    changed: [],
  });

  // Emit live form data changes to parent after state updates (avoids render-phase updates)
  React.useEffect(() => {
    onFormDataChange?.(formData as any);
  }, [formData, onFormDataChange]);

  // console.log("[EditGearForm] formData", formData);

  const handleChange = useCallback(
    (field: string, value: any, section?: string) => {
      const applyUpdate = (
        updater: (prev: typeof formData) => typeof formData,
      ) => {
        setFormData((prev) => updater(prev));
      };
      if (section) {
        // Handle nested updates (e.g., cameraSpecs, lensSpecs)
        applyUpdate(
          (prev) =>
            ({
              ...prev,
              [section]: {
                ...(prev[section as keyof typeof prev] as Record<string, any>),
                [field]: value,
              },
            }) as typeof formData,
        );
      } else {
        // Handle direct gear field updates
        applyUpdate(
          (prev) =>
            ({
              ...prev,
              [field]: value,
            }) as typeof formData,
        );
      }
      // Mark form dirty on any change
      setIsDirty(true);
      onDirtyChange?.(true);
    },
    [],
  );

  // Helpers to compute diff-only payloads we can show and submit
  const equalish = (a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) return true;
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;

    // Arrays: shallow, order-sensitive equality for primitives
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!Object.is(a[i], b[i])) return false;
      }
      return true;
    }

    const toMs = (v: unknown): number | null => {
      if (v instanceof Date) return v.getTime();
      if (typeof v === "string") {
        const t = Date.parse(v);
        return Number.isNaN(t) ? null : t;
      }
      return null;
    };
    const aMs = toMs(a);
    const bMs = toMs(b);
    if (aMs !== null && bMs !== null) return aMs === bMs;

    const toNum = (v: unknown): number | null => {
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (
        typeof v === "string" &&
        v.trim() !== "" &&
        !Number.isNaN(Number(v))
      ) {
        return Number(v);
      }
      return null;
    };
    const aNum = toNum(a);
    const bNum = toNum(b);
    if (aNum !== null && bNum !== null) return aNum === bNum;

    return false;
  };

  const diffByKeys = (
    original: Record<string, any>,
    updated: Record<string, any>,
    keys: readonly string[],
  ) => {
    const out: Record<string, any> = {};
    for (const key of keys) {
      if (!(key in updated)) continue;
      const nextVal = (updated as any)[key];
      const prevVal = (original as any)[key];
      if (!equalish(prevVal, nextVal)) {
        out[key] = nextVal ?? null;
      }
    }
    return out;
  };

  const buildDiffPayload = (): Record<string, any> => {
    const payload: Record<string, any> = {};
    const coreKeys = [
      "name",
      "brandId",
      "mountId",
      "mountIds",
      "announcedDate",
      "announceDatePrecision",
      "releaseDate",
      "releaseDatePrecision",
      "msrpNowUsdCents",
      "msrpAtLaunchUsdCents",
      "mpbMaxPriceUsdCents",
      "weightGrams",
      "widthMm",
      "heightMm",
      "depthMm",
      "linkBh",
      "linkManufacturer",
      "linkMpb",
      "linkAmazon",
      "genres",
      "notes",
    ] as const;
    const coreDiff = diffByKeys(gearData as any, formData as any, coreKeys);
    if (Object.keys(coreDiff).length > 0) payload.core = coreDiff;

    if (formData.cameraSpecs) {
      const cameraKeys = [
        "sensorFormatId",
        "resolutionMp",
        "sensorStackingType",
        "sensorTechType",
        "cameraType",
        "isBackSideIlluminated",
        "sensorReadoutSpeedMs",
        "maxRawBitDepth",
        "isoMin",
        "isoMax",
        "hasIbis",
        "hasElectronicVibrationReduction",
        "cipaStabilizationRatingStops",
        "hasPixelShiftShooting",
        "hasAntiAliasingFilter",
        "precaptureSupportLevel",
        // Displays & viewfinder
        "rearDisplayType",
        "rearDisplayResolutionMillionDots",
        "rearDisplaySizeInches",
        "hasRearTouchscreen",
        "viewfinderType",
        "viewfinderMagnification",
        "viewfinderResolutionMillionDots",
        "hasTopDisplay",
        "processorName",
        "hasWeatherSealing",
        "internalStorageGb",
        "focusPoints",
        "afAreaModes",
        "afSubjectCategories",
        "hasFocusPeaking",
        "hasFocusBracketing",
        "shutterSpeedMax",
        "shutterSpeedMin",
        "maxFpsRaw",
        "maxFpsJpg",
        "maxFpsByShutter",
        "flashSyncSpeed",
        "hasSilentShootingAvailable",
        "availableShutterTypes",
        "cipaBatteryShotsPerCharge",
        "supportedBatteries",
        "usbCharging",
        "usbPowerDelivery",
        "hasLogColorProfile",
        "has10BitVideo",
        "has12BitVideo",
        "hasOpenGateVideo",
        "supportsExternalRecording",
        "supportsRecordToDrive",
        "hasIntervalometer",
        "hasSelfTimer",
        "hasBuiltInFlash",
        "hasHotShoe",
        "hasUsbFileTransfer",
      ] as const;
      const orig = (gearData.cameraSpecs ?? {}) as Record<string, any>;
      const diffs = diffByKeys(orig, formData.cameraSpecs as any, cameraKeys);
      if (Object.keys(diffs).length > 0) payload.camera = diffs;
    }

    if (formData.analogCameraSpecs) {
      const analogKeys = [
        "cameraType",
        "captureMedium",
        "filmTransportType",
        "hasAutoFilmAdvance",
        "hasOptionalMotorizedDrive",
        "viewfinderType",
        "shutterType",
        "shutterSpeedMax",
        "shutterSpeedMin",
        "flashSyncSpeed",
        "hasBulbMode",
        "hasMetering",
        "meteringModes",
        "exposureModes",
        "meteringDisplayTypes",
        "hasExposureCompensation",
        "isoSettingMethod",
        "isoMin",
        "isoMax",
        "hasAutoFocus",
        "focusAidTypes",
        "requiresBatteryForShutter",
        "requiresBatteryForMetering",
        "hasContinuousDrive",
        "maxContinuousFps",
        "hasHotShoe",
        "hasSelfTimer",
        "hasIntervalometer",
      ] as const;
      const orig = (gearData.analogCameraSpecs ?? {}) as Record<string, any>;
      const diffs = diffByKeys(
        orig,
        formData.analogCameraSpecs as any,
        analogKeys,
      );
      if (Object.keys(diffs).length > 0) payload.analogCamera = diffs;
    }

    if (formData.lensSpecs) {
      const lensKeys = [
        "isPrime",
        "focalLengthMinMm",
        "focalLengthMaxMm",
        "imageCircleSizeId",
        "maxApertureWide",
        "maxApertureTele",
        "minApertureWide",
        "minApertureTele",
        "hasStabilization",
        "cipaStabilizationRatingStops",
        "hasStabilizationSwitch",
        "hasAutofocus",
        "isMacro",
        "magnification",
        "minimumFocusDistanceMm",
        "hasFocusRing",
        "focusMotorType",
        "hasAfMfSwitch",
        "hasFocusLimiter",
        "hasFocusRecallButton",
        "numberElements",
        "numberElementGroups",
        "hasDiffractiveOptics",
        "numberDiaphragmBlades",
        "hasRoundedDiaphragmBlades",
        "hasInternalZoom",
        "hasInternalFocus",
        "frontElementRotates",
        "mountMaterial",
        "hasWeatherSealing",
        "hasApertureRing",
        "numberCustomControlRings",
        "numberFunctionButtons",
        "acceptsFilterTypes",
        "frontFilterThreadSizeMm",
        "rearFilterThreadSizeMm",
        "dropInFilterSizeMm",
        "hasBuiltInTeleconverter",
        "hasLensHood",
        "hasTripodCollar",
      ] as const;

      // Submit-time safeguard: if focal-length min and max are equal, treat as prime
      const adjustedLensSpecs: Record<string, any> = {
        ...(formData.lensSpecs as any),
      };
      const minVal = Number((adjustedLensSpecs as any)?.focalLengthMinMm);
      const maxVal = Number((adjustedLensSpecs as any)?.focalLengthMaxMm);
      if (
        Number.isFinite(minVal) &&
        Number.isFinite(maxVal) &&
        minVal === maxVal
      ) {
        adjustedLensSpecs.isPrime = true;
        adjustedLensSpecs.focalLengthMinMm = minVal;
        adjustedLensSpecs.focalLengthMaxMm = maxVal;
      }

      const orig = (gearData.lensSpecs ?? {}) as Record<string, any>;
      const diffs = diffByKeys(orig, adjustedLensSpecs as any, lensKeys);
      if (Object.keys(diffs).length > 0) payload.lens = diffs;
    }

    // Fixed-lens diffs (subset) for cameras
    if ((formData as any).fixedLensSpecs) {
      const fixedKeys = [
        "isPrime",
        "focalLengthMinMm",
        "focalLengthMaxMm",
        "imageCircleSizeId",
        "maxApertureWide",
        "maxApertureTele",
        "minApertureWide",
        "minApertureTele",
        "hasAutofocus",
        "minimumFocusDistanceMm",
        "frontElementRotates",
        "frontFilterThreadSizeMm",
        "hasLensHood",
      ] as const;
      const orig = ((gearData as any).fixedLensSpecs ?? {}) as Record<
        string,
        any
      >;
      const diffs = diffByKeys(
        orig,
        (formData as any).fixedLensSpecs as any,
        fixedKeys,
      );
      if (Object.keys(diffs).length > 0) (payload as any).fixedLens = diffs;
    }

    // Top-level cameraCardSlots (first-class section)
    type NormalizedSlot = {
      slotIndex: number;
      supportedFormFactors: string[];
      supportedBuses: string[];
      supportedSpeedClasses: string[];
    };
    const normalizeVideoModesFromUnknown = (
      value: unknown,
    ): VideoModeNormalized[] => {
      if (!Array.isArray(value)) return [];
      const parsed: VideoModeInput[] = [];
      value.forEach((mode) => {
        const result = videoModeInputSchema.safeParse(mode ?? {});
        if (result.success) {
          parsed.push(result.data);
        }
      });
      return normalizeVideoModes(parsed);
    };

    type VideoModesDiff = {
      added: VideoModeNormalized[];
      removed: VideoModeNormalized[];
      changed: Array<{ prev: VideoModeNormalized; next: VideoModeNormalized }>;
    };

    const diffVideoModes = (
      prev: VideoModeNormalized[],
      next: VideoModeNormalized[],
    ): VideoModesDiff => {
      const keyFor = (mode: VideoModeNormalized) =>
        [
          mode.resolutionKey,
          mode.resolutionLabel,
          mode.fps,
          mode.codecLabel,
        ].join("|");

      const prevMap = new Map<string, VideoModeNormalized>();
      prev.forEach((mode) => prevMap.set(keyFor(mode), mode));

      const nextMap = new Map<string, VideoModeNormalized>();
      next.forEach((mode) => nextMap.set(keyFor(mode), mode));

      const added: VideoModeNormalized[] = [];
      const removed: VideoModeNormalized[] = [];
      const changed: Array<{
        prev: VideoModeNormalized;
        next: VideoModeNormalized;
      }> = [];

      nextMap.forEach((nextMode, key) => {
        const previous = prevMap.get(key);
        if (!previous) {
          added.push(nextMode);
          return;
        }
        const cleanedPrev = { ...previous, notes: previous.notes ?? "" };
        const cleanedNext = { ...nextMode, notes: nextMode.notes ?? "" };
        if (JSON.stringify(cleanedPrev) !== JSON.stringify(cleanedNext)) {
          changed.push({ prev: previous, next: nextMode });
        }
        prevMap.delete(key);
      });

      prevMap.forEach((mode) => {
        removed.push(mode);
      });

      return { added, removed, changed };
    };

    const normalizeSlots = (slots: unknown): NormalizedSlot[] => {
      if (!Array.isArray(slots)) return [] as NormalizedSlot[];
      const out: NormalizedSlot[] = slots
        .map((s: any): NormalizedSlot => {
          const rawIndex =
            typeof s?.slotIndex === "number"
              ? s.slotIndex
              : Number(s?.slotIndex ?? 0);
          const slotIndex =
            Number.isFinite(rawIndex) && rawIndex > 0
              ? Math.trunc(rawIndex)
              : 0;
          const supportedFormFactors = Array.isArray(s?.supportedFormFactors)
            ? [...s.supportedFormFactors]
                .filter((x: unknown): x is string => typeof x === "string")
                .sort()
            : [];
          const supportedBuses = Array.isArray(s?.supportedBuses)
            ? [...s.supportedBuses]
                .filter((x: unknown): x is string => typeof x === "string")
                .sort()
            : [];
          const supportedSpeedClasses = Array.isArray(s?.supportedSpeedClasses)
            ? [...s.supportedSpeedClasses]
                .filter((x: unknown): x is string => typeof x === "string")
                .sort()
            : [];
          return {
            slotIndex,
            supportedFormFactors,
            supportedBuses,
            supportedSpeedClasses,
          };
        })
        .filter((s) => s.slotIndex > 0)
        .sort((a, b) => a.slotIndex - b.slotIndex);
      return out;
    };

    const prevSlots = normalizeSlots((gearData as any).cameraCardSlots);
    const nextSlots = normalizeSlots((formData as any).cameraCardSlots);
    const slotsChanged =
      JSON.stringify(prevSlots) !== JSON.stringify(nextSlots);
    if (slotsChanged) {
      payload.cameraCardSlots = nextSlots;
    }

    const prevVideoModes = normalizeVideoModesFromUnknown(
      (gearData as any).videoModes,
    );
    const nextVideoModes = normalizeVideoModesFromUnknown(
      (formData as any).videoModes,
    );
    videoModesDiffRef.current = diffVideoModes(prevVideoModes, nextVideoModes);
    if (!videoModesEqual(prevVideoModes, nextVideoModes)) {
      payload.videoModes = nextVideoModes;
    }
    return payload;
  };

  const computePayloadStats = (payload: Record<string, any>) => {
    const counts = {
      coreFields: payload.core ? Object.keys(payload.core as any).length : 0,
      cameraFields: payload.camera
        ? Object.keys(payload.camera as any).length
        : 0,
      lensFields: payload.lens ? Object.keys(payload.lens as any).length : 0,
      fixedLensFields: payload.fixedLens
        ? Object.keys(payload.fixedLens as any).length
        : 0,
      cardSlots: Array.isArray(payload.cameraCardSlots)
        ? payload.cameraCardSlots.length
        : 0,
      videoModes: Array.isArray(payload.videoModes)
        ? payload.videoModes.length
        : 0,
    };
    return {
      ...counts,
      sections: Object.keys(payload).length,
      totalFields:
        counts.coreFields +
        counts.cameraFields +
        counts.lensFields +
        counts.fixedLensFields,
    };
  };

  const doSubmit = async () => {
    setIsSubmitting(true);
    onSubmittingChange?.(true);

    // Build diff-only payload: include only changed fields, and include nulls
    // when a value is explicitly cleared.
    const payload: Record<string, unknown> = buildDiffPayload();

    // Guard: no changes
    if (Object.keys(payload).length === 0) {
      toast.info("No changes to submit", {
        description: "Update a field before submitting.",
      });
      setIsSubmitting(false);
      onSubmittingChange?.(false);
      return;
    }
    const payloadStats = computePayloadStats(payload as Record<string, any>);
    void track("gear_edit_submit_attempt", {
      gearSlug,
      sections: payloadStats.sections,
    });

    try {
      console.log("[EditGearForm] submitting suggestion", {
        gearType,
        gearSlug,
        payload,
      });
      console.time(`[EditGearForm] submit ${gearSlug}`);

      const res = await actionSubmitGearProposal({ slug: gearSlug, payload });
      console.timeEnd(`[EditGearForm] submit ${gearSlug}`);
      if (res?.ok) {
        setIsDirty(false);
        onDirtyChange?.(false);
        const createdId = (res as any)?.proposal?.id;
        const autoApproved = Boolean((res as any)?.autoApproved);
        void track("gear_edit_submit_success", {
          gearSlug,
          autoApproved,
        });
        toast.success(
          autoApproved ? "Changes applied" : "Suggestion submitted",
          {
            description: autoApproved
              ? "Your update is live now."
              : "Thanks! We'll review it shortly.",
          },
        );
        if (autoApproved) {
          // In modal/intercept context, close the modal via onRequestClose (router.back()).
          // Fallback to replacing the URL to the gear page when no modal context is present.
          if (onRequestClose) {
            onRequestClose({ force: true });
          } else {
            router.replace(`/gear/${gearSlug}?editApplied=1`);
          }
        } else {
          router.replace(`/edit-success?id=${createdId ?? ""}`);
        }
      } else {
        toast.error("Failed to submit suggestion", {
          description: "Please try again in a moment.",
        });
        void track("gear_edit_submit_failure", {
          gearSlug,
          reason: "unknown",
        });
      }
    } catch (err) {
      console.error("[EditGearForm] submit error", err);
      toast.error("Something went wrong", {
        description: "Could not submit your suggestion.",
      });
      void track("gear_edit_submit_failure", {
        gearSlug,
        reason: err instanceof Error ? err.message : "unknown",
      });
    }

    setIsSubmitting(false);
    onSubmittingChange?.(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const preview = buildDiffPayload();
    // Prevent opening confirmation when nothing actually changed
    if (Object.keys(preview).length === 0) {
      toast.info("No changes to submit", {
        description: "Update a field before submitting.",
      });
      return;
    }
    const stats = computePayloadStats(preview);
    void track("gear_edit_continue", {
      gearSlug,
      fields: stats.totalFields,
    });
    setDiffPreview({
      ...preview,
      __videoModesDiff: videoModesDiffRef.current,
    });
    setConfirmOpen(true);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-12">
      <CoreFields
        sectionId="core-section"
        currentSpecs={
          {
            ...(formData as any),
            // Prefill strictly from current schema keys
            announcedDate: (formData as any).announcedDate ?? null,
            msrpNowUsdCents: (formData as any).msrpNowUsdCents ?? null,
            mpbMaxPriceUsdCents: (formData as any).mpbMaxPriceUsdCents ?? null,
            genres: Array.isArray((formData as any).genres)
              ? ((formData as any).genres as string[])
              : [],
          } as any
        }
        gearType={gearType}
        showMissingOnly={Boolean(showMissingOnly)}
        initialSpecs={
          {
            ...(gearData as any),
            announcedDate: (gearData as any).announcedDate ?? null,
            msrpNowUsdCents: (gearData as any).msrpNowUsdCents ?? null,
            mpbMaxPriceUsdCents: (gearData as any).mpbMaxPriceUsdCents ?? null,
            genres: Array.isArray((gearData as any).genres)
              ? ((gearData as any).genres as string[])
              : [],
          } as any
        }
        onChange={handleChange}
      />

      {/* TODO: Add gear-type-specific fields */}
      {gearType === "CAMERA" && (
        <CameraFields
          sectionId="camera-section"
          gearItem={formData}
          currentSpecs={formData.cameraSpecs}
          showMissingOnly={Boolean(showMissingOnly)}
          initialSpecs={(gearData as any).cameraSpecs as any}
          initialGearItem={gearData as any}
          onChange={(field, value) => handleChange(field, value, "cameraSpecs")}
          onChangeTopLevel={(field, value) => handleChange(field, value)}
        />
      )}

      {gearType === "ANALOG_CAMERA" && (
        <AnalogCameraFields
          sectionId="analog-camera-section"
          currentSpecs={(formData as any).analogCameraSpecs}
          showMissingOnly={Boolean(showMissingOnly)}
          initialSpecs={(gearData as any).analogCameraSpecs as any}
          onChange={(field, value) =>
            handleChange(field as string, value, "analogCameraSpecs")
          }
        />
      )}

      {/* Integrated Lens section (separate card), only when mount is fixed-lens */}
      {(gearType === "CAMERA" || gearType === "ANALOG_CAMERA") &&
        (() => {
          const primaryMountId = Array.isArray((formData as any).mountIds)
            ? ((formData as any).mountIds[0] ?? (formData as any).mountId)
            : (formData as any).mountId;
          const mv = (MOUNTS as any[]).find(
            (m) => m.id === primaryMountId,
          )?.value;
          const isFixed = mv === "fixed-lens";
          if (!isFixed) return null;
          return (
            <FixedLensFields
              sectionId="fixed-lens-section"
              currentSpecs={(formData as any).fixedLensSpecs ?? null}
              showMissingOnly={Boolean(showMissingOnly)}
              initialSpecs={(gearData as any).fixedLensSpecs as any}
              onChange={(field, value) => {
                setFormData(
                  (prev) =>
                    ({
                      ...prev,
                      fixedLensSpecs: {
                        ...((prev as any).fixedLensSpecs ?? {}),
                        [field]: value,
                      },
                    }) as typeof formData,
                );
              }}
            />
          );
        })()}

      {gearType === "LENS" && (
        <LensFields
          sectionId="lens-section"
          currentSpecs={formData.lensSpecs}
          showMissingOnly={Boolean(showMissingOnly)}
          initialSpecs={(gearData as any).lensSpecs as any}
          onChange={(field, value) => handleChange(field, value, "lensSpecs")}
        />
      )}

      {/* Notes (appears last) */}
      <NotesFields
        sectionId="notes-section"
        notes={
          Array.isArray((formData as any).notes)
            ? ((formData as any).notes as string[])
            : []
        }
        onChange={(next: string[]) => handleChange("notes", next)}
      />

      {showActions && (
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onRequestClose ? onRequestClose() : window.history.back()
            }
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            loading={isSubmitting}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="grid max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Submit suggestion?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit these changes for review? You will
              not be able to make adjustments or make a new change request until
              this one is reviewed by an admin.
            </DialogDescription>
          </DialogHeader>
          {/* Diff preview */}
          {diffPreview && (
            <div className="bg-muted/40 border-border mb-4 space-y-2 overflow-y-auto rounded-md border p-3 text-sm">
              {Object.keys(diffPreview).length === 0 ? (
                <p className="text-muted-foreground">No changes detected.</p>
              ) : (
                <>
                  {diffPreview.core && (
                    <div>
                      <div className="mb-1 font-medium">Core</div>
                      <ul className="list-disc pl-5">
                        {Object.entries(
                          diffPreview.core as Record<string, any>,
                        ).map(([k, v]) => {
                          let display: string = String(v);
                          if (
                            k === "msrpNowUsdCents" ||
                            k === "msrpAtLaunchUsdCents" ||
                            k === "mpbMaxPriceUsdCents"
                          )
                            display = formatPrice(v as number);
                          if (k === "releaseDate" || k === "announcedDate")
                            display = formatHumanDate(v as any);
                          if (k === "mountIds") {
                            const ids = Array.isArray(v) ? (v as string[]) : [];
                            display = getMountLongNamesById(ids);
                          }
                          if (k === "mountId") {
                            const ids = v ? [String(v)] : [];
                            display = getMountLongNamesById(ids);
                          }
                          if (k === "notes") {
                            const arr = Array.isArray(v) ? (v as string[]) : [];
                            display = arr.join("; ");
                          }
                          const label =
                            k === "mountIds" ? "Mounts" : humanizeKey(k);
                          return (
                            <li key={k}>
                              <span className="text-muted-foreground">
                                {label}:
                              </span>{" "}
                              <span className="font-medium">{display}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {(diffPreview as any).analogCamera && (
                    <div>
                      <div className="mb-1 font-medium">Analog Camera</div>
                      <ul className="list-disc pl-5">
                        {Object.entries(
                          (diffPreview as any).analogCamera as Record<
                            string,
                            any
                          >,
                        ).map(([k, v]) => (
                          <li key={k}>
                            <span className="text-muted-foreground">
                              {humanizeKey(k)}:
                            </span>{" "}
                            <span className="font-medium">{String(v)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {diffPreview.camera && (
                    <div>
                      <div className="mb-1 font-medium">Camera</div>
                      <ul className="list-disc pl-5">
                        {Array.isArray(
                          (diffPreview.camera as any)?.availableShutterTypes,
                        ) && (
                          <li>
                            <span className="text-muted-foreground">
                              Available Shutter Types:
                            </span>{" "}
                            <span className="font-medium">
                              {(
                                (diffPreview.camera as any)
                                  ?.availableShutterTypes as string[]
                              ).join(", ")}
                            </span>
                          </li>
                        )}
                        {Object.entries(
                          diffPreview.camera as Record<string, any>,
                        ).map(([k, v]) => {
                          if (k === "availableShutterTypes") return null;
                          let display: string = String(v);
                          if (k === "sensorFormatId")
                            display = sensorNameFromSlug(v as string);
                          if (k === "maxFpsRaw" || k === "maxFpsJpg") {
                            display = formatFpsValue(v);
                          }
                          if (k === "maxFpsByShutter") {
                            display = formatMaxFpsByShutter(v);
                          }
                          if (k === "internalStorageGb") {
                            display = formatStorageValue(v);
                          }
                          return (
                            <li key={k}>
                              <span className="text-muted-foreground">
                                {humanizeKey(k)}:
                              </span>{" "}
                              <span className="font-medium">{display}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {diffPreview.lens && (
                    <div>
                      <div className="mb-1 font-medium">Lens</div>
                      <ul className="list-disc pl-5">
                        {Object.entries(
                          diffPreview.lens as Record<string, any>,
                        ).map(([k, v]) => (
                          <li key={k}>
                            <span className="text-muted-foreground">
                              {humanizeKey(k)}:
                            </span>{" "}
                            <span className="font-medium">{String(v)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(diffPreview as any).fixedLens && (
                    <div>
                      <div className="mb-1 font-medium">Integrated Lens</div>
                      <ul className="list-disc pl-5">
                        {Object.entries(
                          (diffPreview as any).fixedLens as Record<string, any>,
                        ).map(([k, v]) => (
                          <li key={k}>
                            <span className="text-muted-foreground">
                              {humanizeKey(k)}:
                            </span>{" "}
                            <span className="font-medium">{String(v)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray((diffPreview as any).cameraCardSlots) && (
                    <div>
                      <div className="mb-1 font-medium">Card Slots</div>
                      <ul className="list-disc pl-5">
                        {((diffPreview as any).cameraCardSlots as any[]).map(
                          (s, i) => (
                            <li key={i}>
                              <span className="text-muted-foreground">
                                Slot {s.slotIndex}:
                              </span>{" "}
                              <span className="font-medium">
                                {formatCardSlotDetails({
                                  slotIndex: Number(s?.slotIndex) || null,
                                  supportedFormFactors: Array.isArray(
                                    s?.supportedFormFactors,
                                  )
                                    ? (s.supportedFormFactors as string[])
                                    : [],
                                  supportedBuses: Array.isArray(
                                    s?.supportedBuses,
                                  )
                                    ? (s.supportedBuses as string[])
                                    : [],
                                  supportedSpeedClasses: Array.isArray(
                                    s?.supportedSpeedClasses,
                                  )
                                    ? (s.supportedSpeedClasses as string[])
                                    : [],
                                })}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                  {(() => {
                    const diffEntryResult = (
                      diffPreview as { __videoModesDiff?: VideoModesDiff }
                    ).__videoModesDiff;
                    if (!diffEntryResult) return null;
                    const { added, removed, changed } = diffEntryResult;
                    if (
                      added.length === 0 &&
                      removed.length === 0 &&
                      changed.length === 0
                    ) {
                      return null;
                    }
                    const renderMode = (
                      mode: VideoModeNormalized,
                      action: "add" | "remove" | "change",
                      prevMode?: VideoModeNormalized,
                    ) => (
                      <div
                        key={`${action}-${mode.resolutionKey}-${mode.fps}-${mode.bitDepth}`}
                        className="flex items-center justify-between rounded border px-3 py-2 text-xs"
                      >
                        <div>
                          <div className="font-semibold">
                            {mode.resolutionLabel}
                          </div>
                          <div className="text-muted-foreground">
                            {mode.fps} fps • {mode.bitDepth}-bit •{" "}
                            {mode.codecLabel}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          {mode.cropFactor && (
                            <Crop className="text-muted-foreground h-3.5 w-3.5" />
                          )}
                          {action === "change" ? (
                            <span className="text-amber-500">Updated</span>
                          ) : (
                            <span
                              className={
                                action === "add"
                                  ? "text-emerald-600"
                                  : "text-red-500"
                              }
                            >
                              {action === "add" ? "+ Added" : "− Removed"}
                            </span>
                          )}
                        </div>
                        {action === "change" && prevMode && (
                          <div className="text-muted-foreground mt-2 w-full text-left text-[11px]">
                            <div>
                              Old: {prevMode.fps} fps • {prevMode.bitDepth}-bit
                              • {prevMode.codecLabel}
                            </div>
                            <div>
                              New: {mode.fps} fps • {mode.bitDepth}-bit •{" "}
                              {mode.codecLabel}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                    return (
                      <div>
                        <div className="mb-1 font-medium">Video Modes</div>
                        <div className="space-y-3">
                          {added.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-emerald-600 uppercase">
                                Added
                              </div>
                              {added.map((mode) => renderMode(mode, "add"))}
                            </div>
                          )}
                          {removed.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-red-500 uppercase">
                                Removed
                              </div>
                              {removed.map((mode) =>
                                renderMode(mode, "remove"),
                              )}
                            </div>
                          )}
                          {changed.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-amber-500 uppercase">
                                Updated
                              </div>
                              {changed.map(({ prev, next }) =>
                                renderMode(next, "change", prev),
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                setConfirmOpen(false);
                await doSubmit();
              }}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Confirm Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

export { EditGearForm };
export default EditGearForm;
