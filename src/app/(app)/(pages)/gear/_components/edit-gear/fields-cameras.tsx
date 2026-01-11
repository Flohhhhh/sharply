"use client";

import { useCallback, memo, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { cameraSpecs, sensorFormats } from "~/server/db/schema";
import { SENSOR_FORMATS, ENUMS, AF_AREA_MODES } from "~/lib/constants";
import { formatCameraType, PRECAPTURE_SUPPORT_OPTIONS } from "~/lib/mapping";
import IsoInput from "~/components/custom-inputs/iso-input";
import SensorFormatInput from "~/components/custom-inputs/sensor-format-input";
import { NumberInput, MultiTextInput } from "~/components/custom-inputs";
import { Switch } from "~/components/ui/switch";
import { BooleanInput } from "~/components/custom-inputs";
import {
  BatteryFullIcon,
  BatteryIcon,
  Grid3X3,
  InfoIcon,
  ZapIcon,
} from "lucide-react";
import { Input } from "~/components/ui/input";
import { MultiSelect } from "~/components/ui/multi-select";
import type { EnrichedCameraSpecs, GearItem } from "~/types/gear";
import CardSlotsManager, { type CardSlot } from "./card-slots-manager";
import { VideoModesManager } from "./video-modes-manager";
// Integrated lens UI moved to edit form level

interface CameraFieldsProps {
  gearItem: GearItem;
  currentSpecs: EnrichedCameraSpecs | null | undefined;
  initialSpecs?: EnrichedCameraSpecs | null | undefined;
  initialGearItem?: GearItem | null;
  showMissingOnly?: boolean;
  onChange: (field: string, value: any) => void;
  onChangeTopLevel?: (field: string, value: any) => void; // for cameraCardSlots
  sectionId?: string;
}

const shutterTypeOrder = ["mechanical", "efc", "electronic"] as const;
type ShutterType = (typeof shutterTypeOrder)[number];
type ShutterFpsEntry = { raw?: number | null; jpg?: number | null };
type ShutterFpsByType = Partial<Record<ShutterType, ShutterFpsEntry>>;

const shutterTypeLabels: Record<ShutterType, string> = {
  mechanical: "Mechanical shutter",
  efc: "Electronic first curtain",
  electronic: "Electronic shutter",
};

function normalizeShutterTypeKey(value: string): ShutterType | null {
  const lowered = value.toLowerCase();
  if (lowered === "efcs") return "efc";
  if (shutterTypeOrder.includes(lowered as ShutterType)) {
    return lowered as ShutterType;
  }
  return null;
}

function normalizeFpsNumericValue(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 10) / 10;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed * 10) / 10;
  }
  return undefined;
}

function normalizeMaxFpsByShutterValue(
  value: unknown,
  availableShutterTypes: string[],
): ShutterFpsByType {
  if (!value || typeof value !== "object") return {};
  const allowedNormalized = (availableShutterTypes ?? [])
    .map((shutterType) => normalizeShutterTypeKey(shutterType))
    .filter((shutterType): shutterType is ShutterType => Boolean(shutterType));
  const allowedSet = new Set<ShutterType>(allowedNormalized);
  const collected: ShutterFpsByType = {};

  for (const [rawKey, rawValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const normalizedKey =
      typeof rawKey === "string" ? normalizeShutterTypeKey(rawKey) : null;
    if (!normalizedKey) continue;
    if (allowedSet.size > 0 && !allowedSet.has(normalizedKey)) continue;
    if (typeof rawValue !== "object" || rawValue === null) continue;
    const rawFps = normalizeFpsNumericValue(
      (rawValue as Record<string, unknown>).raw,
    );
    const jpgFps = normalizeFpsNumericValue(
      (rawValue as Record<string, unknown>).jpg,
    );
    if (rawFps === undefined && jpgFps === undefined) continue;
    collected[normalizedKey] = {
      ...(rawFps !== undefined ? { raw: rawFps } : {}),
      ...(jpgFps !== undefined ? { jpg: jpgFps } : {}),
    };
  }

  const orderedResult: ShutterFpsByType = {};
  const ordering =
    allowedNormalized.length > 0
      ? allowedNormalized
      : Array.from(shutterTypeOrder);
  for (const shutterType of ordering) {
    if (collected[shutterType]) {
      orderedResult[shutterType] = collected[shutterType];
    }
  }

  return orderedResult;
}

function computeHeadlineMaxFps(shutterMap: ShutterFpsByType): {
  maxRaw: number | null;
  maxJpg: number | null;
} {
  let maxRaw: number | null = null;
  let maxJpg: number | null = null;
  for (const entry of Object.values(shutterMap)) {
    if (!entry) continue;
    if (typeof entry.raw === "number") {
      maxRaw = maxRaw === null ? entry.raw : Math.max(maxRaw, entry.raw);
    }
    if (typeof entry.jpg === "number") {
      maxJpg = maxJpg === null ? entry.jpg : Math.max(maxJpg, entry.jpg);
    }
  }
  return { maxRaw, maxJpg };
}

function FpsPerShutterInput({
  availableShutterTypes,
  value,
  onChange,
  onHeadlineChange,
  isVisible,
}: {
  availableShutterTypes: string[];
  value: unknown;
  onChange: (nextValue: ShutterFpsByType | null) => void;
  onHeadlineChange: (maxRaw: number | null, maxJpg: number | null) => void;
  isVisible: boolean;
}) {
  const normalizedAvailable = useMemo(
    () =>
      (availableShutterTypes ?? [])
        .map((shutterType) => normalizeShutterTypeKey(shutterType))
        .filter((shutterType): shutterType is ShutterType =>
          Boolean(shutterType),
        ),
    [availableShutterTypes],
  );

  const normalizedValue = useMemo(
    () => normalizeMaxFpsByShutterValue(value, normalizedAvailable),
    [value, normalizedAvailable],
  );

  const { maxRaw, maxJpg } = useMemo(
    () => computeHeadlineMaxFps(normalizedValue),
    [normalizedValue],
  );

  useEffect(() => {
    const serializedCurrent = JSON.stringify(value ?? {});
    const serializedNormalized = JSON.stringify(normalizedValue);
    if (serializedCurrent !== serializedNormalized) {
      onChange(
        Object.keys(normalizedValue).length > 0 ? normalizedValue : null,
      );
    }
    onHeadlineChange(maxRaw, maxJpg);
  }, [maxRaw, maxJpg, normalizedValue, onChange, onHeadlineChange, value]);

  const handleValueChange = useCallback(
    (
      shutterType: ShutterType,
      field: "raw" | "jpg",
      nextValue: number | null,
    ) => {
      const nextMap: ShutterFpsByType = { ...normalizedValue };
      const currentEntry: ShutterFpsEntry = { ...(nextMap[shutterType] ?? {}) };
      currentEntry[field] = nextValue;

      if (
        (currentEntry.raw === null || currentEntry.raw === undefined) &&
        (currentEntry.jpg === null || currentEntry.jpg === undefined)
      ) {
        delete nextMap[shutterType];
      } else {
        nextMap[shutterType] = currentEntry;
      }

      const headline = computeHeadlineMaxFps(nextMap);
      onChange(Object.keys(nextMap).length > 0 ? nextMap : null);
      onHeadlineChange(headline.maxRaw, headline.maxJpg);
    },
    [normalizedValue, onChange, onHeadlineChange],
  );

  if (!isVisible) return null;

  if (normalizedAvailable.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border p-3 text-sm">
        Select available shutter types to enter max FPS values.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {normalizedAvailable.map((shutterType) => {
        const entry = normalizedValue[shutterType] ?? {};
        return (
          <div key={shutterType} className="space-y-3 rounded-md border p-3">
            <div className="font-semibold">
              {shutterTypeLabels[shutterType] ?? shutterType}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <NumberInput
                  id={`maxFpsByShutter-${shutterType}-raw`}
                  label="RAW FPS"
                  value={
                    entry.raw === null || entry.raw === undefined
                      ? null
                      : entry.raw
                  }
                  onChange={(newValue) =>
                    handleValueChange(
                      shutterType,
                      "raw",
                      newValue === null ? null : Number(newValue),
                    )
                  }
                  placeholder="e.g., 20.0"
                  min={0}
                  max={120}
                  step={0.1}
                  suffix="fps"
                />
              </div>
              <div className="flex-1">
                <NumberInput
                  id={`maxFpsByShutter-${shutterType}-jpg`}
                  label="JPG FPS"
                  value={
                    entry.jpg === null || entry.jpg === undefined
                      ? null
                      : entry.jpg
                  }
                  onChange={(newValue) =>
                    handleValueChange(
                      shutterType,
                      "jpg",
                      newValue === null ? null : Number(newValue),
                    )
                  }
                  placeholder="e.g., 20.0"
                  min={0}
                  max={120}
                  step={0.1}
                  suffix="fps"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Using shared NumberInput from custom-inputs

function CameraFieldsComponent({
  gearItem,
  currentSpecs,
  initialSpecs,
  initialGearItem,
  showMissingOnly,
  onChange,
  onChangeTopLevel,
  sectionId,
}: CameraFieldsProps) {
  // Debug logging
  // console.log("CameraFieldsComponent - currentSpecs:", currentSpecs);

  //if afarea modes is completely missing throw an error
  // if things are working we should get an empty array for no items
  if (!currentSpecs?.afAreaModes) {
    throw new Error("afAreaModes is completely missing");
  }

  const [usePerShutterFps, setUsePerShutterFps] = useState(true);

  // // Use sensor formats from constants
  // const sensorFormatOptions = useMemo(
  //   () =>
  //     SENSOR_FORMATS.map((format) => ({
  //       id: format.slug,
  //       name: format.name,
  //     })),
  //   [],
  // );

  const afAreaModeOptions = useMemo(() => {
    const list: unknown = AF_AREA_MODES;
    if (!Array.isArray(list)) return [] as { id: string; name: string }[];
    const typed = list.filter(
      (mode): mode is { id: string; name: string; brand_id: string | number } =>
        typeof mode === "object" &&
        mode !== null &&
        "id" in mode &&
        "name" in mode &&
        "brand_id" in mode,
    );
    return typed
      .filter((mode) => mode.brand_id === gearItem.brandId)
      .map((mode) => ({ id: mode.id, name: mode.name }));
  }, [gearItem.brandId]);

  const selectedAfAreaModeIds: string[] = useMemo(() => {
    const v: unknown = currentSpecs?.afAreaModes;
    if (!Array.isArray(v) || v.length === 0) return [];
    if (v.every((e): e is string => typeof e === "string")) return v;
    const ids = v
      .map((m): string | undefined => {
        if (typeof m === "object" && m !== null && "id" in m) {
          const id = (m as { id: unknown }).id;
          return typeof id === "string" ? id : undefined;
        }
        return undefined;
      })
      .filter((x): x is string => typeof x === "string");
    return ids;
  }, [currentSpecs?.afAreaModes]);

  // AF Subject Categories (enum-backed)
  const afSubjectCategoryOptions = useMemo(() => {
    const list = (ENUMS as any)?.camera_af_subject_categories_enum as
      | string[]
      | undefined;
    if (!Array.isArray(list)) return [] as { id: string; name: string }[];
    return list.map((v) => ({
      id: v,
      name: v.charAt(0).toUpperCase() + v.slice(1),
    }));
  }, []);

  const selectedAfSubjectCategories: string[] = useMemo(() => {
    const v: unknown = currentSpecs?.afSubjectCategories;
    if (!Array.isArray(v) || v.length === 0) return [];
    return v.filter((x): x is string => typeof x === "string");
  }, [currentSpecs?.afSubjectCategories]);

  // Safe, typed list of camera type enum values with a fallback
  const cameraTypeEnumList: readonly string[] = useMemo(() => {
    const maybe = (ENUMS as unknown as { camera_type_enum?: unknown })
      .camera_type_enum;
    if (Array.isArray(maybe) && maybe.every((x) => typeof x === "string")) {
      return maybe as readonly string[];
    }
    return ["dslr", "mirrorless", "slr", "action", "cinema"] as const;
  }, []);

  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
      console.log("handleFieldChange called:", { fieldId, value });
      onChange(fieldId, value);
    },
    [onChange],
  );

  const numOrNull = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
      return Number(v);
    return null;
  };

  const isMissing = (v: unknown): boolean => {
    if (v == null) return true;
    if (typeof v === "string") return v.trim().length === 0;
    if (Array.isArray(v)) return v.length === 0;
    return false;
  };
  const showWhenMissing = (v: unknown): boolean =>
    !showMissingOnly || isMissing(v);
  const initialVideoModes = Array.isArray(initialGearItem?.videoModes)
    ? initialGearItem?.videoModes
    : [];
  const shouldShowVideoModes =
    !showMissingOnly || initialVideoModes.length === 0;

  return (
    <Card
      id={sectionId}
      className="rounded-md border-0 bg-transparent px-0 py-0"
    >
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">Camera Specifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="flex flex-col gap-3">
          {/* Sensor Format */}
          {showWhenMissing((initialSpecs as any)?.sensorFormatId) && (
            <SensorFormatInput
              id="sensorFormatId"
              label="Sensor Format"
              value={currentSpecs?.sensorFormatId}
              onChange={(value) => handleFieldChange("sensorFormatId", value)}
            />
          )}

          {/* Resolution - Standard Number Input */}
          {showWhenMissing((initialSpecs as any)?.resolutionMp) && (
            <NumberInput
              id="resolutionMp"
              label="Resolution (megapixels)"
              value={
                currentSpecs?.resolutionMp != null
                  ? parseFloat(currentSpecs.resolutionMp)
                  : null
              }
              onChange={(value) => handleFieldChange("resolutionMp", value)}
              placeholder="e.g., 45.0"
              icon={<Grid3X3 className="size-4" />}
              suffix="MP"
              step={0.1}
              min={0}
            />
          )}

          {/* Sensor Stacking Type */}
          {showWhenMissing((initialSpecs as any)?.sensorStackingType) && (
            <div className="space-y-2">
              <Label htmlFor="sensorStackingType">Sensor Stacking Type</Label>
              <Select
                value={currentSpecs?.sensorStackingType ?? ""}
                onValueChange={(value) =>
                  handleFieldChange("sensorStackingType", value)
                }
              >
                <SelectTrigger id="sensorStackingType" className="w-full">
                  <SelectValue placeholder="Sensor Stacking Type" />
                </SelectTrigger>
                <SelectContent>
                  {ENUMS.sensor_stacking_types_enum.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type
                        .replace("-", " ")
                        .split(" ")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sensor Tech Type */}
          {showWhenMissing((initialSpecs as any)?.sensorTechType) && (
            <div className="space-y-2">
              <Label htmlFor="sensorTechType">Sensor Tech Type</Label>
              <Select
                value={currentSpecs?.sensorTechType ?? ""}
                onValueChange={(value) =>
                  handleFieldChange("sensorTechType", value)
                }
              >
                <SelectTrigger id="sensorTechType" className="w-full">
                  <SelectValue placeholder="Sensor Tech Type" />
                </SelectTrigger>
                <SelectContent>
                  {ENUMS.sensor_tech_types_enum.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Camera Type */}
          {showWhenMissing((initialSpecs as any)?.cameraType) && (
            <div className="space-y-2">
              <Label htmlFor="cameraType">Camera Type</Label>
              <Select
                value={currentSpecs?.cameraType ?? ""}
                onValueChange={(value) =>
                  handleFieldChange("cameraType", value)
                }
              >
                <SelectTrigger id="cameraType" className="w-full">
                  <SelectValue placeholder="Camera Type" />
                </SelectTrigger>
                <SelectContent>
                  {cameraTypeEnumList.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatCameraType(type) ?? type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Is Back Side Illuminated */}

          {showWhenMissing((initialSpecs as any)?.isBackSideIlluminated) && (
            <BooleanInput
              id="isBackSideIlluminated"
              label="Back Side Illuminated"
              checked={currentSpecs?.isBackSideIlluminated ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("isBackSideIlluminated", value)
              }
            />
          )}

          {/* Sensor Readout Speed */}

          {showWhenMissing((initialSpecs as any)?.sensorReadoutSpeedMs) && (
            <NumberInput
              id="sensorReadoutSpeedMs"
              label="Sensor Readout Speed (ms)"
              value={
                currentSpecs?.sensorReadoutSpeedMs != null
                  ? parseFloat(currentSpecs.sensorReadoutSpeedMs)
                  : null
              }
              onChange={(value) =>
                handleFieldChange("sensorReadoutSpeedMs", value)
              }
              suffix="ms"
              placeholder="e.g., 10"
              min={0}
              step={0.1}
            />
          )}

          {/* Precapture Support */}
          {showWhenMissing((initialSpecs as any)?.precaptureSupportLevel) && (
            <div className="space-y-2">
              <Label htmlFor="precaptureSupportLevel">
                Precapture Buffer Support
              </Label>
              <Select
                value={
                  currentSpecs?.precaptureSupportLevel != null
                    ? String(currentSpecs.precaptureSupportLevel)
                    : ""
                }
                onValueChange={(value) =>
                  handleFieldChange(
                    "precaptureSupportLevel",
                    value === "" ? null : Number(value),
                  )
                }
              >
                <SelectTrigger id="precaptureSupportLevel" className="w-full">
                  <SelectValue placeholder="Select support level" />
                </SelectTrigger>
                <SelectContent>
                  {PRECAPTURE_SUPPORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ISO Range anchor (always present for sidebar scrolling) */}
          <div id="isoRange" className="h-0" aria-hidden />

          {/* ISO Min */}
          {showWhenMissing((initialSpecs as any)?.isoMin) && (
            <IsoInput
              id="isoMin"
              label="ISO Min (Native)"
              value={currentSpecs?.isoMin}
              onChange={(value) => handleFieldChange("isoMin", value)}
            />
          )}

          {/* ISO Max */}
          {showWhenMissing((initialSpecs as any)?.isoMax) && (
            <IsoInput
              id="isoMax"
              label="ISO Max (Native)"
              value={currentSpecs?.isoMax}
              onChange={(value) => handleFieldChange("isoMax", value)}
            />
          )}

          {/* Rear Display Type */}
          {showWhenMissing((initialSpecs as any)?.rearDisplayType) && (
            <div className="space-y-2">
              <Label htmlFor="rearDisplayType">Rear Display Type</Label>
              <Select
                value={currentSpecs?.rearDisplayType ?? ""}
                onValueChange={(value) =>
                  handleFieldChange("rearDisplayType", value)
                }
              >
                <SelectTrigger id="rearDisplayType" className="w-full">
                  <SelectValue placeholder="Select display type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="single_axis_tilt">
                    Single-axis tilt
                  </SelectItem>
                  <SelectItem value="dual_axis_tilt">Dual-axis tilt</SelectItem>
                  <SelectItem value="fully_articulated">
                    Fully articulated
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Rear Display Resolution (million dots) */}
          {showWhenMissing(
            (initialSpecs as any)?.rearDisplayResolutionMillionDots,
          ) && (
            <NumberInput
              id="rearDisplayResolutionMillionDots"
              label="Rear Display Resolution"
              suffix="million dots"
              value={
                currentSpecs?.rearDisplayResolutionMillionDots != null
                  ? Number(currentSpecs.rearDisplayResolutionMillionDots)
                  : null
              }
              onChange={(value) =>
                handleFieldChange("rearDisplayResolutionMillionDots", value)
              }
              placeholder="e.g., 1.62"
              step={0.01}
              min={0}
            />
          )}

          {/* Rear Display Size (inches) */}
          {showWhenMissing((initialSpecs as any)?.rearDisplaySizeInches) && (
            <NumberInput
              id="rearDisplaySizeInches"
              label="Rear Display Size"
              suffix="inches"
              value={
                currentSpecs?.rearDisplaySizeInches != null
                  ? Number(currentSpecs.rearDisplaySizeInches)
                  : null
              }
              onChange={(value) =>
                handleFieldChange("rearDisplaySizeInches", value)
              }
              placeholder="e.g., 3.2"
              step={0.01}
              min={0}
            />
          )}

          {/* Viewfinder Type */}
          {showWhenMissing((initialSpecs as any)?.viewfinderType) && (
            <div className="space-y-2">
              <Label htmlFor="viewfinderType">Viewfinder Type</Label>
              <Select
                value={currentSpecs?.viewfinderType ?? ""}
                onValueChange={(value) =>
                  handleFieldChange("viewfinderType", value)
                }
              >
                <SelectTrigger id="viewfinderType" className="w-full">
                  <SelectValue placeholder="Select viewfinder type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="optical">OVF (Optical)</SelectItem>
                  <SelectItem value="electronic">EVF (Electronic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Viewfinder Magnification (x) */}
          {(currentSpecs?.viewfinderType ?? "") !== "none" &&
            showWhenMissing((initialSpecs as any)?.viewfinderMagnification) && (
              <NumberInput
                id="viewfinderMagnification"
                label="Viewfinder Magnification"
                suffix="x"
                value={
                  currentSpecs?.viewfinderMagnification != null
                    ? Number(currentSpecs.viewfinderMagnification)
                    : null
                }
                onChange={(value) =>
                  handleFieldChange("viewfinderMagnification", value)
                }
                placeholder="e.g., 0.80"
                step={0.01}
                min={0}
              />
            )}

          {/* Viewfinder Resolution (million dots) */}
          {(currentSpecs?.viewfinderType ?? "") === "electronic" &&
            showWhenMissing(
              (initialSpecs as any)?.viewfinderResolutionMillionDots,
            ) && (
              <NumberInput
                id="viewfinderResolutionMillionDots"
                label="Viewfinder Resolution"
                suffix="million dots"
                value={
                  currentSpecs?.viewfinderResolutionMillionDots != null
                    ? Number(currentSpecs.viewfinderResolutionMillionDots)
                    : null
                }
                onChange={(value) =>
                  handleFieldChange("viewfinderResolutionMillionDots", value)
                }
                placeholder="e.g., 5.76"
                step={0.01}
                min={0}
              />
            )}

          {/* Has Top Display */}
          {showWhenMissing((initialSpecs as any)?.hasTopDisplay) && (
            <BooleanInput
              id="hasTopDisplay"
              label="Has Top Display"
              allowNull
              showStateText
              checked={currentSpecs?.hasTopDisplay ?? null}
              onChange={(value) => handleFieldChange("hasTopDisplay", value)}
            />
          )}

          {/* Has Rear Touchscreen */}
          {showWhenMissing((initialSpecs as any)?.hasRearTouchscreen) && (
            <BooleanInput
              id="hasRearTouchscreen"
              label="Has Rear Touchscreen"
              allowNull
              showStateText
              checked={currentSpecs?.hasRearTouchscreen ?? null}
              onChange={(value) =>
                handleFieldChange("hasRearTouchscreen", value)
              }
            />
          )}

          {/* Max Raw Bit Depth */}
          {showWhenMissing((initialSpecs as any)?.maxRawBitDepth) && (
            <div className="space-y-2">
              <Label htmlFor="maxRawBitDepth">Max Raw Bit Depth</Label>
              <Select
                value={currentSpecs?.maxRawBitDepth ?? ""}
                onValueChange={(value) =>
                  handleFieldChange("maxRawBitDepth", value)
                }
              >
                <SelectTrigger id="maxRawBitDepth" className="w-full">
                  <SelectValue placeholder="Max Raw Bit Depth" />
                </SelectTrigger>
                <SelectContent>
                  {ENUMS.raw_bit_depth_enum.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type} bit
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Has Ibis */}
          {showWhenMissing((initialSpecs as any)?.hasIbis) && (
            <BooleanInput
              id="hasIbis"
              label="Has IBIS (Physical)"
              checked={currentSpecs?.hasIbis ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasIbis", value)}
            />
          )}

          {/* Has Electronic Vibration Reduction */}
          {showWhenMissing(
            (initialSpecs as any)?.hasElectronicVibrationReduction,
          ) && (
            <BooleanInput
              id="hasElectronicVibrationReduction"
              label="Has Electronic VR (Digital)"
              checked={currentSpecs?.hasElectronicVibrationReduction ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasElectronicVibrationReduction", value)
              }
            />
          )}

          {/* CIPA Stabilization Rating Stops */}
          {showWhenMissing(
            (initialSpecs as any)?.cipaStabilizationRatingStops,
          ) && (
            <NumberInput
              id="cipaStabilizationRatingStops"
              label="CIPA Stabilization Rating Stops"
              value={numOrNull(currentSpecs?.cipaStabilizationRatingStops)}
              onChange={(value) =>
                handleFieldChange("cipaStabilizationRatingStops", value)
              }
              placeholder="e.g., 3.0"
              min={0}
              max={10}
              step={0.1}
              suffix="stops"
            />
          )}

          {/* Has Pixel Shift Shooting */}
          {showWhenMissing((initialSpecs as any)?.hasPixelShiftShooting) && (
            <BooleanInput
              id="hasPixelShiftShooting"
              label="Has Pixel Shift Shooting"
              checked={currentSpecs?.hasPixelShiftShooting ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasPixelShiftShooting", value)
              }
            />
          )}

          {/* Has Anti Aliasing Filter */}
          {showWhenMissing((initialSpecs as any)?.hasAntiAliasingFilter) && (
            <BooleanInput
              id="hasAntiAliasingFilter"
              label="Has Anti Aliasing Filter"
              checked={currentSpecs?.hasAntiAliasingFilter ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasAntiAliasingFilter", value)
              }
            />
          )}

          {/* Card Slots Manager */}
          {(() => {
            const hadSlots = Array.isArray(
              (initialGearItem as any)?.cameraCardSlots,
            )
              ? (((initialGearItem as any)?.cameraCardSlots as unknown[]) ?? [])
                  .length > 0
              : false;
            if (showMissingOnly && hadSlots) return null;
            return (
              <CardSlotsManager
                value={
                  (gearItem as any)?.cameraCardSlots as CardSlot[] | undefined
                }
                onChange={(slots) =>
                  onChangeTopLevel?.("cameraCardSlots", slots)
                }
              />
            );
          })()}

          {/* Processor Name */}
          {showWhenMissing((initialSpecs as any)?.processorName) && (
            <div className="space-y-2">
              <Label htmlFor="processorName">Processor Name</Label>
              <Input
                id="processorName"
                value={currentSpecs?.processorName ?? ""}
                onChange={(e) =>
                  handleFieldChange("processorName", e.target.value)
                }
              />
            </div>
          )}

          {/* Has Weather Sealing */}
          {showWhenMissing((initialSpecs as any)?.hasWeatherSealing) && (
            <BooleanInput
              id="hasWeatherSealing"
              label="Has Weather Sealing"
              checked={currentSpecs?.hasWeatherSealing ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasWeatherSealing", value)
              }
            />
          )}

          {/* Focus Points */}
          {showWhenMissing((initialSpecs as any)?.focusPoints) && (
            <NumberInput
              id="focusPoints"
              label="Focus Points"
              value={currentSpecs?.focusPoints ?? null}
              onChange={(value) => handleFieldChange("focusPoints", value)}
            />
          )}

          {/* AF Area Modes */}
          {/* TODO: add a way for creating new af area modes (review plan)*/}
          {showWhenMissing((initialSpecs as any)?.afAreaModes) && (
            <div id="afAreaModes" className="space-y-2">
              <Label htmlFor="afAreaModes">AF Area Modes</Label>
              <MultiSelect
                options={afAreaModeOptions}
                value={selectedAfAreaModeIds}
                onChange={(value) => handleFieldChange("afAreaModes", value)}
              />
            </div>
          )}

          {/* AF Subject Categories */}
          {showWhenMissing((initialSpecs as any)?.afSubjectCategories) && (
            <div id="afSubjectCategories" className="space-y-2">
              <Label htmlFor="afSubjectCategories">AF Subject Categories</Label>
              <MultiSelect
                options={afSubjectCategoryOptions}
                value={selectedAfSubjectCategories}
                onChange={(ids) =>
                  handleFieldChange("afSubjectCategories", ids)
                }
              />
            </div>
          )}

          {/* Has Focus Peaking */}
          {showWhenMissing((initialSpecs as any)?.hasFocusPeaking) && (
            <BooleanInput
              id="hasFocusPeaking"
              label="Has Focus Peaking"
              checked={currentSpecs?.hasFocusPeaking ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasFocusPeaking", value)}
            />
          )}

          {/* Has Focus Bracketing */}
          {showWhenMissing((initialSpecs as any)?.hasFocusBracketing) && (
            <BooleanInput
              id="hasFocusBracketing"
              label="Has Focus Bracketing"
              checked={currentSpecs?.hasFocusBracketing ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasFocusBracketing", value)
              }
            />
          )}

          {/* Shutter Speed Max */}
          {showWhenMissing((initialSpecs as any)?.shutterSpeedMax) && (
            <NumberInput
              id="shutterSpeedMax"
              label="Longest Shutter Speed"
              suffix="sec."
              value={currentSpecs?.shutterSpeedMax ?? null}
              onChange={(value) => handleFieldChange("shutterSpeedMax", value)}
            />
          )}

          {/* Shutter Speed Min */}
          {showWhenMissing((initialSpecs as any)?.shutterSpeedMin) && (
            <NumberInput
              id="shutterSpeedMin"
              label="Shortest Shutter Speed"
              prefix="1/"
              value={currentSpecs?.shutterSpeedMin ?? null}
              onChange={(value) => handleFieldChange("shutterSpeedMin", value)}
            />
          )}

          {/* Flash Sync Speed */}
          {showWhenMissing((initialSpecs as any)?.flashSyncSpeed) && (
            <NumberInput
              id="flashSyncSpeed"
              label="Flash Sync Speed"
              icon={<ZapIcon />}
              prefix="1/"
              value={currentSpecs?.flashSyncSpeed}
              onChange={(value) => handleFieldChange("flashSyncSpeed", value)}
            />
          )}

          {/* Has Silent Shooting Available */}
          {showWhenMissing(
            (initialSpecs as any)?.hasSilentShootingAvailable,
          ) && (
            <BooleanInput
              id="hasSilentShootingAvailable"
              label="Has Silent Shooting Available"
              checked={currentSpecs?.hasSilentShootingAvailable ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasSilentShootingAvailable", value)
              }
            />
          )}

          {/* Available Shutter Types */}
          {showWhenMissing((initialSpecs as any)?.availableShutterTypes) && (
            <div id="availableShutterTypes" className="space-y-2">
              <Label htmlFor="availableShutterTypes">
                Available Shutter Types
              </Label>
              <MultiSelect
                inDialog
                options={ENUMS.shutter_types_enum.map((type) => ({
                  id: type,
                  // TODO map these proper formatted names
                  name: type,
                }))}
                value={currentSpecs?.availableShutterTypes ?? []}
                onChange={(value: string[]) =>
                  handleFieldChange("availableShutterTypes", value)
                }
              />
            </div>
          )}

          {/* Max Continuous FPS */}
          {(showWhenMissing((initialSpecs as any)?.maxFpsRaw) ||
            showWhenMissing((initialSpecs as any)?.maxFpsJpg)) && (
            <div id="maxFpsByShutter" className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label>Max Continuous FPS (Photo)</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="usePerShutterFps"
                    checked={usePerShutterFps}
                    onCheckedChange={(checked) => {
                      const enabled = checked === true;
                      setUsePerShutterFps(enabled);
                      if (!enabled) {
                        handleFieldChange("maxFpsByShutter", null);
                      }
                    }}
                  />
                  <Label
                    htmlFor="usePerShutterFps"
                    className="text-muted-foreground cursor-pointer text-sm"
                  >
                    Use per-shutter inputs
                  </Label>
                </div>
              </div>

              {!usePerShutterFps && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <NumberInput
                      id="maxFpsRaw"
                      label="Max FPS (RAW)"
                      value={
                        currentSpecs?.maxFpsRaw != null
                          ? parseFloat(currentSpecs.maxFpsRaw)
                          : null
                      }
                      onChange={(value) =>
                        handleFieldChange("maxFpsRaw", value)
                      }
                      placeholder="e.g., 20.0"
                      min={0}
                      max={120}
                      step={0.1}
                      suffix="fps"
                    />
                  </div>
                  <div className="flex-1">
                    <NumberInput
                      id="maxFpsJpg"
                      label="Max FPS (JPG)"
                      value={
                        currentSpecs?.maxFpsJpg != null
                          ? parseFloat(currentSpecs.maxFpsJpg)
                          : null
                      }
                      onChange={(value) =>
                        handleFieldChange("maxFpsJpg", value)
                      }
                      placeholder="e.g., 20.0"
                      min={0}
                      max={120}
                      step={0.1}
                      suffix="fps"
                    />
                  </div>
                </div>
              )}

              {usePerShutterFps && (
                <FpsPerShutterInput
                  availableShutterTypes={
                    currentSpecs?.availableShutterTypes ?? []
                  }
                  value={currentSpecs?.maxFpsByShutter}
                  onChange={(nextValue) =>
                    handleFieldChange("maxFpsByShutter", nextValue)
                  }
                  onHeadlineChange={(maxRaw, maxJpg) => {
                    if (maxRaw !== currentSpecs?.maxFpsRaw) {
                      handleFieldChange("maxFpsRaw", maxRaw);
                    }
                    if (maxJpg !== currentSpecs?.maxFpsJpg) {
                      handleFieldChange("maxFpsJpg", maxJpg);
                    }
                  }}
                  isVisible
                />
              )}
            </div>
          )}

          {/* CIPA Battery Shots Per Charge */}
          {showWhenMissing((initialSpecs as any)?.internalStorageGb) && (
            <NumberInput
              id="internalStorageGb"
              label="Internal Storage"
              suffix="GB"
              value={
                currentSpecs?.internalStorageGb != null
                  ? Number(currentSpecs.internalStorageGb)
                  : null
              }
              onChange={(value) =>
                handleFieldChange("internalStorageGb", value)
              }
              placeholder="e.g., 512"
              min={0}
              step={0.1}
            />
          )}

          {showWhenMissing(
            (initialSpecs as any)?.cipaBatteryShotsPerCharge,
          ) && (
            <NumberInput
              id="cipaBatteryShotsPerCharge"
              label="CIPA Battery Shots Per Charge"
              icon={<BatteryFullIcon />}
              value={currentSpecs?.cipaBatteryShotsPerCharge}
              onChange={(value) =>
                handleFieldChange("cipaBatteryShotsPerCharge", value)
              }
            />
          )}

          {/* Supported Batteries */}
          {showWhenMissing((initialSpecs as any)?.supportedBatteries) && (
            <div
              id="supportedBatteries"
              data-force-ring-container
              className="space-y-2"
            >
              <MultiTextInput
                id="supportedBatteries"
                label="Supported Batteries"
                values={
                  Array.isArray((currentSpecs as any)?.supportedBatteries)
                    ? (
                        (currentSpecs as any).supportedBatteries as unknown[]
                      ).filter((x): x is string => typeof x === "string")
                    : []
                }
                onChange={(value) =>
                  handleFieldChange("supportedBatteries", value)
                }
                placeholder="e.g., NP-FZ100"
              />
            </div>
          )}

          {/* USB Charging */}
          {showWhenMissing((initialSpecs as any)?.usbCharging) && (
            <BooleanInput
              id="usbCharging"
              label="USB Charging"
              checked={currentSpecs?.usbCharging ?? null}
              allowNull
              showStateText
              tooltip="Camera is able to charge its inserted batteries via USB"
              onChange={(value) => handleFieldChange("usbCharging", value)}
            />
          )}

          {/* USB Power Delivery */}
          {showWhenMissing((initialSpecs as any)?.usbPowerDelivery) && (
            <BooleanInput
              id="usbPowerDelivery"
              label="USB Power Delivery"
              checked={currentSpecs?.usbPowerDelivery ?? null}
              allowNull
              showStateText
              tooltip="Camera is able to operate while plugged into USB and will draw less or no power from the battery"
              onChange={(value) => handleFieldChange("usbPowerDelivery", value)}
            />
          )}

          {/* Has Log Color Profile */}
          {showWhenMissing((initialSpecs as any)?.hasLogColorProfile) && (
            <BooleanInput
              id="hasLogColorProfile"
              label="Has Log Color Profile"
              checked={currentSpecs?.hasLogColorProfile ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasLogColorProfile", value)
              }
            />
          )}

          {/* Has 10 Bit Video */}
          {showWhenMissing((initialSpecs as any)?.has10BitVideo) && (
            <BooleanInput
              id="has10BitVideo"
              label="Has 10 Bit Video"
              checked={currentSpecs?.has10BitVideo ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("has10BitVideo", value)}
            />
          )}

          {/* Has 12 Bit Video */}
          {showWhenMissing((initialSpecs as any)?.has12BitVideo) && (
            <BooleanInput
              id="has12BitVideo"
              label="Has 12 Bit Video"
              checked={currentSpecs?.has12BitVideo ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("has12BitVideo", value)}
            />
          )}

          {/* Has Open Gate Video */}
          {showWhenMissing((initialSpecs as any)?.hasOpenGateVideo) && (
            <BooleanInput
              id="hasOpenGateVideo"
              label="Has Open Gate Video"
              checked={currentSpecs?.hasOpenGateVideo ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasOpenGateVideo", value)}
            />
          )}

          {/* Supports External Recording */}
          {showWhenMissing(
            (initialSpecs as any)?.supportsExternalRecording,
          ) && (
            <BooleanInput
              id="supportsExternalRecording"
              label="Supports External Recording"
              checked={currentSpecs?.supportsExternalRecording ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("supportsExternalRecording", value)
              }
            />
          )}

          {/* Supports Recording to Drive */}
          {showWhenMissing((initialSpecs as any)?.supportsRecordToDrive) && (
            <BooleanInput
              id="supportsRecordToDrive"
              label="Supports Recording to Drive"
              checked={currentSpecs?.supportsRecordToDrive ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("supportsRecordToDrive", value)
              }
            />
          )}

          {shouldShowVideoModes && (
            <VideoModesManager
              value={gearItem.videoModes ?? []}
              initialModes={initialGearItem?.videoModes ?? []}
              onChange={(modes) => onChangeTopLevel?.("videoModes", modes)}
            />
          )}

          {/* Has Intervalometer */}
          {showWhenMissing((initialSpecs as any)?.hasIntervalometer) && (
            <BooleanInput
              id="hasIntervalometer"
              label="Has Intervalometer"
              checked={currentSpecs?.hasIntervalometer ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasIntervalometer", value)
              }
            />
          )}

          {/* Has Self Timer */}
          {showWhenMissing((initialSpecs as any)?.hasSelfTimer) && (
            <BooleanInput
              id="hasSelfTimer"
              label="Has Self Timer"
              checked={currentSpecs?.hasSelfTimer ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasSelfTimer", value)}
            />
          )}

          {/* Has Built In Flash */}
          {showWhenMissing((initialSpecs as any)?.hasBuiltInFlash) && (
            <BooleanInput
              id="hasBuiltInFlash"
              label="Has Built In Flash"
              checked={currentSpecs?.hasBuiltInFlash ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasBuiltInFlash", value)}
            />
          )}

          {/* Has Hot Shoe */}
          {showWhenMissing((initialSpecs as any)?.hasHotShoe) && (
            <BooleanInput
              id="hasHotShoe"
              label="Has Hot Shoe"
              checked={currentSpecs?.hasHotShoe ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasHotShoe", value)}
            />
          )}

          {/* Has USB File Transfer */}
          {showWhenMissing((initialSpecs as any)?.hasUsbFileTransfer) && (
            <BooleanInput
              id="hasUsbFileTransfer"
              label="Has USB File Transfer"
              checked={currentSpecs?.hasUsbFileTransfer ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasUsbFileTransfer", value)
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(CameraFieldsComponent);
