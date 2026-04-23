"use client";

import { track } from "@vercel/analytics";
import { Crop } from "lucide-react";
import { useLocale,useTranslations, type TranslationValues } from "next-intl";
import { useRouter } from "next/navigation";
import React,{ useCallback,useState } from "react";
import { toast } from "sonner";
import { NotesFields } from "~/app/[locale]/(pages)/gear/_components/edit-gear/fields-notes";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { formatDate } from "~/lib/format/date";
import { MOUNTS } from "~/lib/generated";
import {
  getSpecFieldLabel,
  getSpecSectionTitle,
  translateGearDetailWithFallback,
} from "~/lib/i18n/gear-detail";
import { formatCardSlotDetails,formatPrice } from "~/lib/mapping";
import { getMountLongNamesById } from "~/lib/mapping/mounts-map";
import { sensorNameFromSlug } from "~/lib/mapping/sensor-map";
import { humanizeKey } from "~/lib/utils";
import {
  normalizeVideoModes,
  type VideoModeInput,
  videoModeInputSchema,
  type VideoModeNormalized,
  videoModesEqual,
} from "~/lib/video/mode-schema";
import { actionSubmitGearProposal } from "~/server/gear/actions";
import type { FixedLensSpecs,GearItem,GearType } from "~/types/gear";
import { AnalogCameraFields } from "./fields-analog-cameras";
import CameraFields from "./fields-cameras";
import { CoreFields } from "./fields-core";
import { FixedLensFields } from "./fields-fixed-lens";
import { LensFields } from "./fields-lenses";

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
  autoSubmit?: boolean;
  canToggleAutoSubmit?: boolean;
  gearType?: GearType;
  gearSlug: string;
  gearData: GearItem;
  onAutoSubmitChange?: (autoSubmit: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onRequestClose?: (opts?: { force?: boolean }) => void;
  onSubmittingChange?: (submitting: boolean) => void;
  showActions?: boolean;
  formId?: string;
  showMissingOnly?: boolean; // Controls filtering of fields based on initial values
  onFormDataChange?: (data: GearItem) => void;
}

type NestedSectionKey =
  | "cameraSpecs"
  | "analogCameraSpecs"
  | "lensSpecs"
  | "fixedLensSpecs";

type DiffSection = Record<string, unknown>;

type DiffPayload = {
  core?: DiffSection;
  camera?: DiffSection;
  analogCamera?: DiffSection;
  lens?: DiffSection;
  fixedLens?: DiffSection;
  cameraCardSlots?: NormalizedSlot[];
  videoModes?: VideoModeNormalized[];
  __videoModesDiff?: VideoModesDiff;
};

type ProposalSubmitResult = {
  ok?: boolean;
  autoApproved?: boolean;
  proposal?: { id?: string | null } | null;
};

type FixedLensFieldValue = FixedLensSpecs[keyof FixedLensSpecs] | null;

type NormalizedSlot = {
  slotIndex: number;
  supportedFormFactors: string[];
  supportedBuses: string[];
  supportedSpeedClasses: string[];
};

type VideoModesDiff = {
  added: VideoModeNormalized[];
  removed: VideoModeNormalized[];
  changed: Array<{ prev: VideoModeNormalized; next: VideoModeNormalized }>;
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function EditGearForm({
  autoSubmit,
  canToggleAutoSubmit = false,
  gearType,
  gearData,
  gearSlug,
  onAutoSubmitChange,
  onDirtyChange,
  onRequestClose,
  onSubmittingChange,
  showActions = true,
  formId,
  showMissingOnly,
  onFormDataChange,
}: EditGearFormProps) {
  const locale = useLocale();
  const t = useTranslations("gearDetail");
  const tf = (key: string, fallback: string, values?: TranslationValues) =>
    translateGearDetailWithFallback(t, key, fallback, values);
  const router = useRouter();
  const [internalAutoSubmit, setInternalAutoSubmit] = useState(
    Boolean(canToggleAutoSubmit),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<GearItem>(gearData);
  const [diffPreview, setDiffPreview] = useState<DiffPayload | null>(null);
  const initialCoreSpecs = gearData;
  const initialCameraSpecs = gearData.cameraSpecs;
  const initialAnalogCameraSpecs = gearData.analogCameraSpecs;
  const initialFixedLensSpecs = gearData.fixedLensSpecs;
  const initialLensSpecs = gearData.lensSpecs;
  const formMountIds = Array.isArray(formData.mountIds) ? formData.mountIds : [];
  const primaryMountId = formMountIds[0] ?? formData.mountId ?? null;
  const effectiveAutoSubmit =
    typeof autoSubmit === "boolean" ? autoSubmit : internalAutoSubmit;
  const videoModesDiffRef = React.useRef<VideoModesDiff>({
    added: [],
    removed: [],
    changed: [],
  });

  // Emit live form data changes to parent after state updates (avoids render-phase updates)
  React.useEffect(() => {
    onFormDataChange?.(formData);
  }, [formData, onFormDataChange]);

  React.useEffect(() => {
    if (!isDirty) {
      setFormData(gearData);
    }
  }, [gearData, isDirty]);

  React.useEffect(() => {
    onAutoSubmitChange?.(effectiveAutoSubmit);
  }, [effectiveAutoSubmit, onAutoSubmitChange]);

  const handleAutoSubmitChange = useCallback(
    (checked: boolean) => {
      if (typeof autoSubmit !== "boolean") {
        setInternalAutoSubmit(checked);
      }
      onAutoSubmitChange?.(checked);
    },
    [autoSubmit, onAutoSubmitChange],
  );

  const getDiffSectionTitle = useCallback(
    (section: "core" | "analogCamera" | "camera" | "lens" | "fixedLens") => {
      switch (section) {
        case "core":
          return getSpecSectionTitle(t, "core", "Basic Information");
        case "analogCamera":
          return getSpecSectionTitle(t, "analog-camera", "Analog Camera");
        case "camera":
          return tf("editGear.sections.camera", "Camera");
        case "lens":
          return tf("editGear.sections.lens", "Lens");
        case "fixedLens":
          return tf("editGear.sections.integratedLens", "Integrated Lens");
      }
    },
    [t, tf],
  );

  const getCoreDiffLabel = useCallback(
    (key: string) => {
      switch (key) {
        case "mountId":
          return getSpecFieldLabel(t, "core", "mounts", "Mount");
        case "mountIds":
          return getSpecFieldLabel(
            t,
            "core",
            "mounts",
            "Mounts",
            "labelPlural",
          );
        case "announcedDate":
          return getSpecFieldLabel(t, "core", "announcedDate", "Announced Date");
        case "announceDatePrecision":
          return tf("editGear.fields.announcedDatePrecision", "Announced Date Precision");
        case "releaseDate":
          return getSpecFieldLabel(t, "core", "releaseDate", "Release Date");
        case "releaseDatePrecision":
          return tf("editGear.fields.releaseDatePrecision", "Release Date Precision");
        case "msrpNowUsdCents":
          return tf("editGear.fields.msrpNow", "MSRP now (USD)");
        case "msrpAtLaunchUsdCents":
          return tf("editGear.fields.msrpAtLaunch", "MSRP at launch (USD)");
        case "mpbMaxPriceUsdCents":
          return tf("editGear.fields.mpbMaxPrice", "MPB max price (USD)");
        case "weightGrams":
          return getSpecFieldLabel(t, "core", "weightGrams", "Weight");
        case "widthMm":
          return tf("editGear.fields.width", "Width");
        case "heightMm":
          return tf("editGear.fields.height", "Height");
        case "depthMm":
          return tf("editGear.fields.depth", "Depth");
        case "linkManufacturer":
          return tf("editGear.fields.manufacturerLink", "Manufacturer Link");
        case "linkMpb":
          return tf("editGear.fields.mpbLink", "MPB Link");
        case "linkBh":
          return tf("editGear.fields.bhLink", "B&H Link");
        case "linkAmazon":
          return tf("editGear.fields.amazonLink", "Amazon Link");
        case "genres":
          return tf("editGear.fields.bestUseCases", "Best use cases");
        case "notes":
          return getSpecSectionTitle(t, "notes", "Notes");
        default:
          return humanizeKey(key);
      }
    },
    [t, tf],
  );

  const cameraFieldSectionMap: Record<string, string> = {
    sensorFormatId: "camera-sensor-shutter",
    resolutionMp: "camera-sensor-shutter",
    sensorStackingType: "camera-sensor-shutter",
    sensorTechType: "camera-sensor-shutter",
    cameraType: "camera-sensor-shutter",
    isBackSideIlluminated: "camera-sensor-shutter",
    sensorReadoutSpeedMs: "camera-sensor-shutter",
    maxRawBitDepth: "camera-sensor-shutter",
    isoMin: "camera-sensor-shutter",
    isoMax: "camera-sensor-shutter",
    hasIbis: "camera-sensor-shutter",
    hasElectronicVibrationReduction: "camera-sensor-shutter",
    cipaStabilizationRatingStops: "camera-sensor-shutter",
    hasPixelShiftShooting: "camera-sensor-shutter",
    hasAntiAliasingFilter: "camera-sensor-shutter",
    precaptureSupportLevel: "camera-sensor-shutter",
    shutterSpeedMax: "camera-sensor-shutter",
    shutterSpeedMin: "camera-sensor-shutter",
    maxFpsRaw: "camera-sensor-shutter",
    maxFpsJpg: "camera-sensor-shutter",
    maxFpsByShutter: "camera-sensor-shutter",
    flashSyncSpeed: "camera-sensor-shutter",
    hasSilentShootingAvailable: "camera-sensor-shutter",
    availableShutterTypes: "camera-sensor-shutter",
    rearDisplayType: "camera-hardware",
    rearDisplayResolutionMillionDots: "camera-hardware",
    rearDisplaySizeInches: "camera-hardware",
    viewfinderType: "camera-hardware",
    viewfinderMagnification: "camera-hardware",
    viewfinderResolutionMillionDots: "camera-hardware",
    hasTopDisplay: "camera-hardware",
    hasRearTouchscreen: "camera-hardware",
    processorName: "camera-hardware",
    hasWeatherSealing: "camera-hardware",
    internalStorageGb: "camera-hardware",
    focusPoints: "camera-focus",
    afAreaModes: "camera-focus",
    afSubjectCategories: "camera-focus",
    hasFocusPeaking: "camera-focus",
    hasFocusBracketing: "camera-focus",
    cipaBatteryShotsPerCharge: "camera-battery",
    supportedBatteries: "camera-battery",
    usbCharging: "camera-battery",
    usbPowerDelivery: "camera-battery",
    hasLogColorProfile: "camera-video",
    has10BitVideo: "camera-video",
    has12BitVideo: "camera-video",
    hasOpenGateVideo: "camera-video",
    supportsExternalRecording: "camera-video",
    supportsRecordToDrive: "camera-video",
    hasIntervalometer: "camera-misc",
    hasSelfTimer: "camera-misc",
    hasBuiltInFlash: "camera-misc",
    hasHotShoe: "camera-misc",
    hasUsbFileTransfer: "camera-misc",
  };

  const getCameraDiffLabel = useCallback(
    (key: string) => {
      const sectionId = cameraFieldSectionMap[key];
      if (sectionId) {
        return getSpecFieldLabel(t, sectionId, key, humanizeKey(key));
      }
      return humanizeKey(key);
    },
    [t],
  );

  const getSectionDiffLabel = useCallback(
    (
      section:
        | "analogCamera"
        | "camera"
        | "lens"
        | "fixedLens",
      key: string,
    ) => {
      if (section === "camera") return getCameraDiffLabel(key);
      if (section === "analogCamera") {
        return getSpecFieldLabel(t, "analog-camera", key, humanizeKey(key));
      }

      const lensSectionMap: Record<string, string> =
        section === "fixedLens"
          ? {
              focalLengthMinMm: "lens-optics",
              focalLengthMaxMm: "lens-optics",
              imageCircleSizeId: "lens-optics",
              maxApertureWide: "lens-aperture",
              maxApertureTele: "lens-aperture",
              minApertureWide: "lens-aperture",
              minApertureTele: "lens-aperture",
              hasAutofocus: "lens-focus",
              minimumFocusDistanceMm: "lens-optics",
              frontElementRotates: "lens-focus",
              frontFilterThreadSizeMm: "lens-filters",
              hasLensHood: "lens-accessories",
            }
          : {
              isPrime: "lens-optics",
              focalLengthMinMm: "lens-optics",
              focalLengthMaxMm: "lens-optics",
              imageCircleSizeId: "lens-optics",
              magnification: "lens-optics",
              minimumFocusDistanceMm: "lens-optics",
              numberElements: "lens-optics",
              numberElementGroups: "lens-optics",
              hasDiffractiveOptics: "lens-optics",
              maxApertureWide: "lens-aperture",
              maxApertureTele: "lens-aperture",
              minApertureWide: "lens-aperture",
              minApertureTele: "lens-aperture",
              numberDiaphragmBlades: "lens-aperture",
              hasRoundedDiaphragmBlades: "lens-aperture",
              hasApertureRing: "lens-build",
              hasAutofocus: "lens-focus",
              focusMotorType: "lens-focus",
              hasAfMfSwitch: "lens-focus",
              hasFocusLimiter: "lens-focus",
              hasFocusRecallButton: "lens-focus",
              hasFocusRing: "lens-focus",
              hasInternalFocus: "lens-focus",
              frontElementRotates: "lens-focus",
              hasStabilization: "lens-stabilization",
              hasStabilizationSwitch: "lens-stabilization",
              cipaStabilizationRatingStops: "lens-stabilization",
              hasInternalZoom: "lens-build",
              mountMaterial: "lens-build",
              hasWeatherSealing: "lens-build",
              numberCustomControlRings: "lens-build",
              numberFunctionButtons: "lens-build",
              acceptsFilterTypes: "lens-filters",
              frontFilterThreadSizeMm: "lens-filters",
              rearFilterThreadSizeMm: "lens-filters",
              dropInFilterSizeMm: "lens-filters",
              hasBuiltInTeleconverter: "lens-accessories",
              hasLensHood: "lens-accessories",
              hasTripodCollar: "lens-accessories",
              isTiltShift: "lens-tilt-shift",
              tiltDegrees: "lens-tilt-shift",
              shiftMm: "lens-tilt-shift",
            };
      const sectionId = lensSectionMap[key];
      return sectionId
        ? getSpecFieldLabel(t, sectionId, key, humanizeKey(key))
        : humanizeKey(key);
    },
    [getCameraDiffLabel, t],
  );

  // console.log("[EditGearForm] formData", formData);

  const handleChange = useCallback(
    (field: string, value: unknown, section?: NestedSectionKey) => {
      const applyUpdate = (
        updater: (prev: typeof formData) => typeof formData,
      ) => {
        setFormData((prev) => updater(prev));
      };
      if (section) {
        // Handle nested updates (e.g., cameraSpecs, lensSpecs)
        applyUpdate(
          (prev) => {
            const currentSection = prev[section];
            return {
              ...prev,
              [section]: {
                ...toRecord(currentSection),
                [field]: value,
              },
            };
          },
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
    original: Record<string, unknown>,
    updated: Record<string, unknown>,
    keys: readonly string[],
  ): DiffSection => {
    const out: DiffSection = {};
    for (const key of keys) {
      if (!(key in updated)) continue;
      const nextVal = updated[key];
      const prevVal = original[key];
      if (!equalish(prevVal, nextVal)) {
        out[key] = nextVal ?? null;
      }
    }
    return out;
  };

  const buildDiffPayload = (): DiffPayload => {
    const payload: DiffPayload = {};
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
    const coreDiff = diffByKeys(toRecord(gearData), toRecord(formData), coreKeys);
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
      const orig = toRecord(gearData.cameraSpecs);
      const diffs = diffByKeys(orig, toRecord(formData.cameraSpecs), cameraKeys);
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
        "supportedBatteries",
        "hasContinuousDrive",
        "maxContinuousFps",
        "hasHotShoe",
        "hasSelfTimer",
        "hasIntervalometer",
      ] as const;
      const orig = toRecord(gearData.analogCameraSpecs);
      const diffs = diffByKeys(
        orig,
        toRecord(formData.analogCameraSpecs),
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
        "isTiltShift",
        "tiltDegrees",
        "shiftMm",
      ] as const;

      // Submit-time safeguard: if focal-length min and max are equal, treat as prime
      const adjustedLensSpecs = {
        ...toRecord(formData.lensSpecs),
      };
      const minVal = Number(adjustedLensSpecs.focalLengthMinMm);
      const maxVal = Number(adjustedLensSpecs.focalLengthMaxMm);
      if (
        Number.isFinite(minVal) &&
        Number.isFinite(maxVal) &&
        minVal === maxVal
      ) {
        adjustedLensSpecs.isPrime = true;
        adjustedLensSpecs.focalLengthMinMm = minVal;
        adjustedLensSpecs.focalLengthMaxMm = maxVal;
      }

      const orig = toRecord(gearData.lensSpecs);
      const diffs = diffByKeys(orig, adjustedLensSpecs, lensKeys);
      if (Object.keys(diffs).length > 0) payload.lens = diffs;
    }

    // Fixed-lens diffs (subset) for cameras
    if (formData.fixedLensSpecs) {
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
      const orig = toRecord(gearData.fixedLensSpecs);
      const diffs = diffByKeys(orig, toRecord(formData.fixedLensSpecs), fixedKeys);
      if (Object.keys(diffs).length > 0) payload.fixedLens = diffs;
    }

    // Top-level cameraCardSlots (first-class section)
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
        .map((slot): NormalizedSlot => {
          const slotRecord = toRecord(slot);
          const rawSlotIndex = slotRecord.slotIndex;
          const rawIndex =
            typeof rawSlotIndex === "number"
              ? rawSlotIndex
              : Number(rawSlotIndex ?? 0);
          const slotIndex =
            Number.isFinite(rawIndex) && rawIndex > 0
              ? Math.trunc(rawIndex)
              : 0;
          const supportedFormFactors = Array.isArray(slotRecord.supportedFormFactors)
            ? [...slotRecord.supportedFormFactors]
                .filter((x: unknown): x is string => typeof x === "string")
                .sort()
            : [];
          const supportedBuses = Array.isArray(slotRecord.supportedBuses)
            ? [...slotRecord.supportedBuses]
                .filter((x: unknown): x is string => typeof x === "string")
                .sort()
            : [];
          const supportedSpeedClasses = Array.isArray(slotRecord.supportedSpeedClasses)
            ? [...slotRecord.supportedSpeedClasses]
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

    const prevSlots = normalizeSlots(gearData.cameraCardSlots);
    const nextSlots = normalizeSlots(formData.cameraCardSlots);
    const slotsChanged =
      JSON.stringify(prevSlots) !== JSON.stringify(nextSlots);
    if (slotsChanged) {
      payload.cameraCardSlots = nextSlots;
    }

    const prevVideoModes = normalizeVideoModesFromUnknown(
      gearData.videoModes,
    );
    const nextVideoModes = normalizeVideoModesFromUnknown(
      formData.videoModes,
    );
    videoModesDiffRef.current = diffVideoModes(prevVideoModes, nextVideoModes);
    if (!videoModesEqual(prevVideoModes, nextVideoModes)) {
      payload.videoModes = nextVideoModes;
    }
    return payload;
  };

  const computePayloadStats = (payload: DiffPayload) => {
    const counts = {
      coreFields: payload.core ? Object.keys(payload.core).length : 0,
      cameraFields: payload.camera
        ? Object.keys(payload.camera).length
        : 0,
      lensFields: payload.lens ? Object.keys(payload.lens).length : 0,
      fixedLensFields: payload.fixedLens
        ? Object.keys(payload.fixedLens).length
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
    const payload = buildDiffPayload();

    // Guard: no changes
    if (Object.keys(payload).length === 0) {
      toast.info(tf("editGear.noChangesToastTitle", "No changes to submit"), {
        description: tf(
          "editGear.noChangesToastDescription",
          "Update a field before submitting.",
        ),
      });
      setIsSubmitting(false);
      onSubmittingChange?.(false);
      return;
    }
    const payloadStats = computePayloadStats(payload);
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

      const res = (await actionSubmitGearProposal({
        slug: gearSlug,
        payload,
        autoSubmit: effectiveAutoSubmit,
      })) as ProposalSubmitResult;
      console.timeEnd(`[EditGearForm] submit ${gearSlug}`);
      if (res?.ok) {
        setIsDirty(false);
        onDirtyChange?.(false);
        const createdId = res.proposal?.id;
        const autoApproved = Boolean(res.autoApproved);
        void track("gear_edit_submit_success", {
          gearSlug,
          autoApproved,
        });
        toast.success(
          autoApproved
            ? tf(
                "editGear.submitAutoApprovedTitle",
                "Your change request was automatically approved!",
              )
            : tf("editGear.submitSuccessTitle", "Suggestion submitted"),
          {
            description: autoApproved
              ? tf("editGear.submitAutoApprovedDescription", "Your update is live now.")
              : tf(
                  "editGear.submitSuccessDescription",
                  "Thanks! We'll review it shortly.",
                ),
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
        toast.error(tf("editGear.submitFailedTitle", "Failed to submit suggestion"), {
          description: tf(
            "editGear.submitFailedDescription",
            "Please try again in a moment.",
          ),
        });
        void track("gear_edit_submit_failure", {
          gearSlug,
          reason: "unknown",
        });
      }
    } catch (err) {
      console.error("[EditGearForm] submit error", err);
      toast.error(tf("editGear.submitUnexpectedTitle", "Something went wrong"), {
        description: tf(
          "editGear.submitUnexpectedDescription",
          "Could not submit your suggestion.",
        ),
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
      toast.info(tf("editGear.noChangesToastTitle", "No changes to submit"), {
        description: tf(
          "editGear.noChangesToastDescription",
          "Update a field before submitting.",
        ),
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
        currentSpecs={{
          announcedDate: formData.announcedDate ?? null,
          announceDatePrecision: formData.announceDatePrecision,
          releaseDate: formData.releaseDate ?? null,
          releaseDatePrecision: formData.releaseDatePrecision,
          msrpNowUsdCents: formData.msrpNowUsdCents ?? null,
          msrpAtLaunchUsdCents: formData.msrpAtLaunchUsdCents ?? null,
          mpbMaxPriceUsdCents: formData.mpbMaxPriceUsdCents ?? null,
          mountId: formData.mountId,
          mountIds: formData.mountIds,
          weightGrams: formData.weightGrams ?? null,
          widthMm: toNullableNumber(formData.widthMm),
          heightMm: toNullableNumber(formData.heightMm),
          depthMm: toNullableNumber(formData.depthMm),
          linkManufacturer: formData.linkManufacturer,
          linkMpb: formData.linkMpb,
          linkBh: formData.linkBh,
          linkAmazon: formData.linkAmazon,
          genres: Array.isArray(formData.genres) ? formData.genres : [],
        }}
        gearType={gearType}
        showMissingOnly={Boolean(showMissingOnly)}
        initialSpecs={{
          announcedDate: initialCoreSpecs.announcedDate ?? null,
          announceDatePrecision: initialCoreSpecs.announceDatePrecision,
          releaseDate: initialCoreSpecs.releaseDate ?? null,
          releaseDatePrecision: initialCoreSpecs.releaseDatePrecision,
          msrpNowUsdCents: initialCoreSpecs.msrpNowUsdCents ?? null,
          msrpAtLaunchUsdCents: initialCoreSpecs.msrpAtLaunchUsdCents ?? null,
          mpbMaxPriceUsdCents: initialCoreSpecs.mpbMaxPriceUsdCents ?? null,
          mountId: initialCoreSpecs.mountId,
          mountIds: initialCoreSpecs.mountIds,
          weightGrams: initialCoreSpecs.weightGrams ?? null,
          widthMm: toNullableNumber(initialCoreSpecs.widthMm),
          heightMm: toNullableNumber(initialCoreSpecs.heightMm),
          depthMm: toNullableNumber(initialCoreSpecs.depthMm),
          linkManufacturer: initialCoreSpecs.linkManufacturer,
          linkMpb: initialCoreSpecs.linkMpb,
          linkBh: initialCoreSpecs.linkBh,
          linkAmazon: initialCoreSpecs.linkAmazon,
          genres: Array.isArray(initialCoreSpecs.genres)
            ? initialCoreSpecs.genres
            : [],
        }}
        onChange={handleChange}
      />

      {/* TODO: Add gear-type-specific fields */}
      {gearType === "CAMERA" && (
        <CameraFields
          sectionId="camera-section"
          gearItem={formData}
          currentSpecs={formData.cameraSpecs}
          showMissingOnly={Boolean(showMissingOnly)}
          initialSpecs={initialCameraSpecs}
          initialGearItem={gearData}
          onChange={(field, value) => handleChange(field, value, "cameraSpecs")}
          onChangeTopLevel={(field, value) => handleChange(field, value)}
        />
      )}

      {gearType === "ANALOG_CAMERA" && (
        <AnalogCameraFields
          sectionId="analog-camera-section"
          currentSpecs={formData.analogCameraSpecs}
          showMissingOnly={Boolean(showMissingOnly)}
          initialSpecs={initialAnalogCameraSpecs}
          onChange={(field, value) =>
            handleChange(field as string, value, "analogCameraSpecs")
          }
        />
      )}

      {/* Integrated Lens section (separate card), only when mount is fixed-lens */}
      {(gearType === "CAMERA" || gearType === "ANALOG_CAMERA") &&
        (() => {
          const mv = (
            MOUNTS as Array<{ id: string; value: string }>
          ).find((mount) => mount.id === primaryMountId)?.value;
          const isFixed = mv === "fixed-lens";
          if (!isFixed) return null;
          return (
            <FixedLensFields
              sectionId="fixed-lens-section"
              currentSpecs={formData.fixedLensSpecs ?? null}
              showMissingOnly={Boolean(showMissingOnly)}
              initialSpecs={initialFixedLensSpecs}
              onChange={(field, value: FixedLensFieldValue) => {
                setFormData(
                  (prev) =>
                    ({
                      ...prev,
                      fixedLensSpecs: {
                        ...(prev.fixedLensSpecs ?? ({} as FixedLensSpecs)),
                        [field]: value,
                      } as FixedLensSpecs,
                    }) as GearItem,
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
          initialSpecs={initialLensSpecs}
          onChange={(field, value) => handleChange(field, value, "lensSpecs")}
        />
      )}

      {/* Notes (appears last) */}
      <NotesFields
        sectionId="notes-section"
        notes={Array.isArray(formData.notes) ? formData.notes : []}
        onChange={(next: string[]) => handleChange("notes", next)}
      />

      {showActions && (
        <div className="flex justify-end space-x-4">
          {canToggleAutoSubmit ? (
            <div className="mr-auto flex items-center gap-2">
              <Checkbox
                id="edit-gear-auto-submit"
                checked={effectiveAutoSubmit}
                onCheckedChange={(checked) =>
                  handleAutoSubmitChange(checked === true)
                }
              />
              <Label htmlFor="edit-gear-auto-submit">
                {tf("editGear.autoSubmit", "Auto-Submit")}
              </Label>
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onRequestClose ? onRequestClose() : window.history.back()
            }
          >
            {tf("cancel", "Cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            loading={isSubmitting}
          >
            {tf("editGear.continue", "Continue")}
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="grid max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {tf("editGear.submitSuggestionTitle", "Submit suggestion?")}
            </DialogTitle>
            <DialogDescription>
              {canToggleAutoSubmit
                ? effectiveAutoSubmit
                  ? tf(
                      "editGear.submitSuggestionAutoSubmitDescription",
                      "These changes will be auto-approved and applied to the gear page immediately.",
                    )
                  : tf(
                      "editGear.submitSuggestionReviewDescription",
                      "These changes will be submitted for moderator review, just like a normal user submission.",
                    )
                : tf(
                    "editGear.submitSuggestionDefaultDescription",
                    "Are you sure you want to submit these changes for review? You will not be able to make adjustments or make a new change request until this one is reviewed by an admin.",
                  )}
            </DialogDescription>
          </DialogHeader>
          {/* Diff preview */}
          {diffPreview && (
            <div className="bg-muted/40 border-border mb-4 space-y-2 overflow-y-auto rounded-md border p-3 text-sm">
              {Object.keys(diffPreview).length === 0 ? (
                <p className="text-muted-foreground">
                  {tf("editGear.noChangesDetected", "No changes detected.")}
                </p>
              ) : (
                <>
                  {diffPreview.core && (
                    <div>
                      <div className="mb-1 font-medium">
                        {getDiffSectionTitle("core")}
                      </div>
                      <ul className="list-disc pl-5">
                        {Object.entries(diffPreview.core).map(([k, v]) => {
                          let display = safeString(v);
                          if (
                            k === "msrpNowUsdCents" ||
                            k === "msrpAtLaunchUsdCents" ||
                            k === "mpbMaxPriceUsdCents"
                          )
                            display = formatPrice(v as number);
                          if (
                            (k === "releaseDate" || k === "announcedDate") &&
                            (typeof v === "string" || v instanceof Date)
                          )
                            display = formatDate(v, {
                              locale,
                              preset: "date-long",
                            });
                          if (k === "mountIds") {
                            const ids = Array.isArray(v) ? (v as string[]) : [];
                            display = getMountLongNamesById(ids);
                          }
                          if (k === "mountId") {
                            const ids = v == null ? [] : [safeString(v)];
                            display = getMountLongNamesById(ids);
                          }
                          if (k === "notes") {
                            const arr = Array.isArray(v) ? (v as string[]) : [];
                            display = arr.join("; ");
                          }
                          const label = getCoreDiffLabel(k);
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
                  {diffPreview.analogCamera && (
                    <div>
                      <div className="mb-1 font-medium">
                        {getDiffSectionTitle("analogCamera")}
                      </div>
                      <ul className="list-disc pl-5">
                        {Object.entries(diffPreview.analogCamera).map(
                          ([k, v]) => (
                          <li key={k}>
                            <span className="text-muted-foreground">
                              {getSectionDiffLabel("analogCamera", k)}:
                            </span>{" "}
                            <span className="font-medium">{safeString(v)}</span>
                          </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                  {diffPreview.camera && (
                    <div>
                      <div className="mb-1 font-medium">
                        {getDiffSectionTitle("camera")}
                      </div>
                      <ul className="list-disc pl-5">
                        {Array.isArray(
                          diffPreview.camera.availableShutterTypes,
                        ) && (
                          <li>
                            <span className="text-muted-foreground">
                              {getCameraDiffLabel("availableShutterTypes")}:
                            </span>{" "}
                            <span className="font-medium">
                              {diffPreview.camera.availableShutterTypes.join(
                                ", ",
                              )}
                            </span>
                          </li>
                        )}
                        {Object.entries(diffPreview.camera).map(([k, v]) => {
                          if (k === "availableShutterTypes") return null;
                          let display = safeString(v);
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
                                {getCameraDiffLabel(k)}:
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
                      <div className="mb-1 font-medium">
                        {getDiffSectionTitle("lens")}
                      </div>
                      <ul className="list-disc pl-5">
                        {Object.entries(diffPreview.lens).map(([k, v]) => (
                          <li key={k}>
                            <span className="text-muted-foreground">
                              {getSectionDiffLabel("lens", k)}:
                            </span>{" "}
                            <span className="font-medium">{safeString(v)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {diffPreview.fixedLens && (
                    <div>
                      <div className="mb-1 font-medium">
                        {getDiffSectionTitle("fixedLens")}
                      </div>
                      <ul className="list-disc pl-5">
                        {Object.entries(diffPreview.fixedLens).map(([k, v]) => (
                          <li key={k}>
                            <span className="text-muted-foreground">
                              {getSectionDiffLabel("fixedLens", k)}:
                            </span>{" "}
                            <span className="font-medium">{safeString(v)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(diffPreview.cameraCardSlots) && (
                    <div>
                      <div className="mb-1 font-medium">
                        {tf("editGear.sections.cardSlots", "Card Slots")}
                      </div>
                      <ul className="list-disc pl-5">
                        {diffPreview.cameraCardSlots.map((slot, i) => (
                            <li key={i}>
                              <span className="text-muted-foreground">
                                {tf("editGear.slotLabel", "Slot {index}", {
                                  index: slot.slotIndex,
                                })}
                                :
                              </span>{" "}
                              <span className="font-medium">
                                {formatCardSlotDetails({
                                  slotIndex: Number(slot.slotIndex) || null,
                                  supportedFormFactors:
                                    slot.supportedFormFactors,
                                  supportedBuses: slot.supportedBuses,
                                  supportedSpeedClasses:
                                    slot.supportedSpeedClasses,
                                })}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {(() => {
                    const diffEntryResult = diffPreview.__videoModesDiff;
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
                            <span className="text-amber-500">
                              {tf("editGear.updated", "Updated")}
                            </span>
                          ) : (
                            <span
                              className={
                                action === "add"
                                  ? "text-emerald-600"
                                  : "text-red-500"
                              }
                            >
                              {action === "add"
                                ? `+ ${tf("editGear.added", "Added")}`
                                : `− ${tf("editGear.removed", "Removed")}`}
                            </span>
                          )}
                        </div>
                        {action === "change" && prevMode && (
                          <div className="text-muted-foreground mt-2 w-full text-left text-[11px]">
                            <div>
                              {tf("editGear.old", "Old")}: {prevMode.fps} fps •{" "}
                              {prevMode.bitDepth}-bit • {prevMode.codecLabel}
                            </div>
                            <div>
                              {tf("editGear.new", "New")}: {mode.fps} fps •{" "}
                              {mode.bitDepth}-bit • {mode.codecLabel}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                    return (
                      <div>
                        <div className="mb-1 font-medium">
                          {tf("editGear.sections.videoModes", "Video Modes")}
                        </div>
                        <div className="space-y-3">
                          {added.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-emerald-600 uppercase">
                                {tf("editGear.added", "Added")}
                              </div>
                              {added.map((mode) => renderMode(mode, "add"))}
                            </div>
                          )}
                          {removed.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-red-500 uppercase">
                                {tf("editGear.removed", "Removed")}
                              </div>
                              {removed.map((mode) =>
                                renderMode(mode, "remove"),
                              )}
                            </div>
                          )}
                          {changed.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-amber-500 uppercase">
                                {tf("editGear.updated", "Updated")}
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
            {canToggleAutoSubmit ? (
              <div className="mr-auto flex items-center gap-2">
                <Checkbox
                  id="edit-gear-confirm-auto-submit"
                  checked={effectiveAutoSubmit}
                onCheckedChange={(checked) =>
                  handleAutoSubmitChange(checked === true)
                }
              />
              <Label htmlFor="edit-gear-confirm-auto-submit">
                {tf("editGear.autoSubmit", "Auto-Submit")}
              </Label>
            </div>
          ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isSubmitting}
            >
              {tf("cancel", "Cancel")}
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
              {canToggleAutoSubmit && effectiveAutoSubmit
                ? tf("editGear.applyNow", "Apply Now")
                : tf("editGear.confirmSubmit", "Confirm Submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

export { EditGearForm };
export default EditGearForm;
