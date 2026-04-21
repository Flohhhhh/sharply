"use client";

import { memo,useCallback,useMemo } from "react";
import { BooleanInput,NumberInput } from "~/components/custom-inputs";
import FocalLengthInput from "~/components/custom-inputs/focal-length-input";
import LensApertureInput from "~/components/custom-inputs/lens-aperture-input";
import { Card,CardContent,CardHeader,CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { MultiSelect } from "~/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ENUMS,SENSOR_FORMATS } from "~/lib/constants";
import { formatFilterType } from "~/lib/mapping/filter-types-map";
import { formatFocusDistance } from "~/lib/mapping/focus-distance-map";
import { sortSensorFormats } from "~/lib/sensor-formats";
import type { lensSpecs } from "~/server/db/schema";

type SensorFormatOption = {
  id: string;
  name: string;
  slug: string;
};

interface LensFieldsProps {
  currentSpecs: typeof lensSpecs.$inferSelect | null | undefined;
  initialSpecs?: typeof lensSpecs.$inferSelect | null | undefined;
  showMissingOnly?: boolean;
  onChange: (field: string, value: any) => void;
  sectionId?: string;
}

// Simple wrapper for standard number inputs (template)

function LensFieldsComponent({
  currentSpecs,
  initialSpecs,
  showMissingOnly,
  onChange,
  sectionId,
}: LensFieldsProps) {
  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
      onChange(fieldId, value);
    },
    [onChange],
  );

  // component-local prime/zoom state handled inside FocalLengthInput
  const numOrNull = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
      return Number(v);
    return null;
  };

  // helpers for unit conversion (display cm, store mm)
  const cmFromMm = (mm: number | null): number | null => {
    if (mm == null) return null;
    return mm / 10;
  };
  const mmFromCm = (cm: number | null): number | null => {
    if (cm == null) return null;
    return Math.round(cm * 10);
  };

  const isMissing = (v: unknown): boolean => {
    if (v == null) return true;
    if (typeof v === "string") return v.trim().length === 0;
    if (Array.isArray(v)) return v.length === 0;
    return false;
  };
  const showWhenMissing = (v: unknown): boolean =>
    !showMissingOnly || isMissing(v);

  const isPrimeLens = currentSpecs?.isPrime === true;
  const hasStabilization = currentSpecs?.hasStabilization === true;
  const hasAutofocus = currentSpecs?.hasAutofocus === true;
  const isTiltShift = currentSpecs?.isTiltShift === true;
  const CLEAR_SENSOR_FORMAT_VALUE = "none";
  const sensorFormatOptions = useMemo(
    () =>
      sortSensorFormats(SENSOR_FORMATS as SensorFormatOption[]).map((format) => ({
        id: format.id,
        name: format.name,
      })),
    [],
  );

  return (
    <Card
      id={sectionId}
      className="rounded-md border-0 bg-transparent px-0 py-0"
    >
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">Lens Specifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="flex flex-col gap-3">
          {showWhenMissing(
            initialSpecs?.focalLengthMinMm ?? initialSpecs?.focalLengthMaxMm,
          ) && (
            <FocalLengthInput
              className="col-span-2"
              id="focalLength"
              label="Focal Length (mm)"
              minValue={currentSpecs?.focalLengthMinMm ?? null}
              maxValue={currentSpecs?.focalLengthMaxMm ?? null}
              onChange={({ focalLengthMinMm, focalLengthMaxMm, isPrime }) => {
                handleFieldChange("focalLengthMinMm", focalLengthMinMm);
                handleFieldChange("focalLengthMaxMm", focalLengthMaxMm);
                handleFieldChange("isPrime", isPrime);
                if (isPrime) {
                  handleFieldChange("hasInternalZoom", null);
                }
              }}
            />
          )}

          {/* Image Circle Size */}
          {showWhenMissing(initialSpecs?.imageCircleSizeId) && (
            <div className="space-y-2">
              <Label htmlFor="imageCircleSize">Image Circle Size</Label>
              <Select
                value={
                  currentSpecs?.imageCircleSizeId ?? CLEAR_SENSOR_FORMAT_VALUE
                }
                onValueChange={(value) =>
                  handleFieldChange(
                    "imageCircleSizeId",
                    value === CLEAR_SENSOR_FORMAT_VALUE ? null : value,
                  )
                }
              >
                <SelectTrigger id="imageCircleSize" className="w-full">
                  <SelectValue placeholder="Select sensor format coverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CLEAR_SENSOR_FORMAT_VALUE}>
                    None
                  </SelectItem>
                  {sensorFormatOptions.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Aperture input */}
          {showWhenMissing(
            initialSpecs?.maxApertureWide ??
              initialSpecs?.maxApertureTele ??
              initialSpecs?.minApertureWide ??
              initialSpecs?.minApertureTele,
          ) && (
            <LensApertureInput
              className="col-span-2"
              id="aperture"
              label="Aperture"
              maxApertureWide={numOrNull(currentSpecs?.maxApertureWide)}
              maxApertureTele={numOrNull(currentSpecs?.maxApertureTele)}
              minApertureWide={numOrNull(currentSpecs?.minApertureWide)}
              minApertureTele={numOrNull(currentSpecs?.minApertureTele)}
              onChange={({
                maxApertureWide,
                maxApertureTele,
                minApertureWide,
                minApertureTele,
              }) => {
                handleFieldChange("maxApertureWide", maxApertureWide);
                handleFieldChange("maxApertureTele", maxApertureTele);
                handleFieldChange("minApertureWide", minApertureWide);
                handleFieldChange("minApertureTele", minApertureTele);
              }}
            />
          )}

          {/* Image Stabilization */}
          {showWhenMissing(initialSpecs?.hasStabilization) && (
            <BooleanInput
              id="hasStabilization"
              label="Has Image Stabilization"
              checked={currentSpecs?.hasStabilization ?? null}
              allowNull
              showStateText
              onChange={(value) => {
                handleFieldChange("hasStabilization", value);
                if (value !== true) {
                  // Clear dependent fields when stabilization is not enabled
                  handleFieldChange("hasStabilizationSwitch", null);
                  handleFieldChange("cipaStabilizationRatingStops", null);
                }
              }}
            />
          )}

          {/* Has Stabilization Switch */}
          {showWhenMissing(initialSpecs?.hasStabilizationSwitch) && (
            <BooleanInput
              id="hasStabilizationSwitch"
              label="Has Stabilization Switch"
              checked={
                hasStabilization
                  ? (currentSpecs?.hasStabilizationSwitch ?? null)
                  : null
              }
              disabled={!hasStabilization}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasStabilizationSwitch", value)
              }
            />
          )}

          {/* CIPA Stabilization Rating Stops */}
          {showWhenMissing(initialSpecs?.cipaStabilizationRatingStops) && (
            <NumberInput
              className="col-span-2"
              id="cipaStabilizationRatingStops"
              label="CIPA Stabilization Rating Stops"
              suffix="stops"
              disabled={!hasStabilization}
              value={
                hasStabilization
                  ? numOrNull(currentSpecs?.cipaStabilizationRatingStops)
                  : null
              }
              onChange={(value) =>
                handleFieldChange("cipaStabilizationRatingStops", value)
              }
            />
          )}

          {/* Has Autofocus */}
          {showWhenMissing(initialSpecs?.hasAutofocus) && (
            <BooleanInput
              id="hasAutofocus"
              label="Has Autofocus"
              checked={currentSpecs?.hasAutofocus ?? null}
              allowNull
              showStateText
              onChange={(value) => {
                handleFieldChange("hasAutofocus", value);
                if (value !== true) {
                  handleFieldChange("focusMotorType", null);
                  handleFieldChange("hasAfMfSwitch", null);
                  handleFieldChange("hasFocusLimiter", null);
                  handleFieldChange("hasFocusRecallButton", null);
                }
              }}
            />
          )}

          {/* Focus Motor Type */}
          {showWhenMissing(initialSpecs?.focusMotorType) && (
            <div className="space-y-2">
              <Label htmlFor="focusMotorType">Focus Motor Type</Label>
              <Input
                id="focusMotorType"
                disabled={!hasAutofocus}
                value={
                  hasAutofocus ? (currentSpecs?.focusMotorType ?? "") : ""
                }
                onChange={(e) =>
                  handleFieldChange(
                    "focusMotorType",
                    (e.target as HTMLInputElement).value,
                  )
                }
              />
            </div>
          )}

          {/* Has AF/MF Switch */}
          {showWhenMissing(initialSpecs?.hasAfMfSwitch) && (
            <BooleanInput
              id="hasAfMfSwitch"
              label="Has AF/MF Switch"
              checked={
                hasAutofocus ? (currentSpecs?.hasAfMfSwitch ?? null) : null
              }
              disabled={!hasAutofocus}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasAfMfSwitch", value)}
            />
          )}

          {/* Has Focus Limiter */}
          {showWhenMissing(initialSpecs?.hasFocusLimiter) && (
            <BooleanInput
              id="hasFocusLimiter"
              label="Has Focus Limiter"
              checked={
                hasAutofocus ? (currentSpecs?.hasFocusLimiter ?? null) : null
              }
              disabled={!hasAutofocus}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasFocusLimiter", value)}
            />
          )}

          {/* Has Focus Recall Button */}
          {showWhenMissing(initialSpecs?.hasFocusRecallButton) && (
            <BooleanInput
              id="hasFocusRecallButton"
              label="Has Focus Recall Button"
              checked={
                hasAutofocus
                  ? (currentSpecs?.hasFocusRecallButton ?? null)
                  : null
              }
              disabled={!hasAutofocus}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasFocusRecallButton", value)
              }
            />
          )}

          {/* Magnification */}
          {showWhenMissing(initialSpecs?.magnification) && (
            <NumberInput
              id="magnification"
              label="Magnification"
              suffix="x"
              value={numOrNull(currentSpecs?.magnification)}
              onChange={(value) => handleFieldChange("magnification", value)}
            />
          )}

          {/* Minimum Focus Distance */}
          {showWhenMissing(initialSpecs?.minimumFocusDistanceMm) && (
            <div className="space-y-1">
              <NumberInput
                id="minimumFocusDistanceMm"
                label="Minimum Focus Distance"
                // tooltip="Enter in cm. Stored as mm. Examples: 25 cm = 250 mm; 1 m = 100 cm = 1000 mm."
                suffix="cm"
                step={0.1}
                min={0}
                value={cmFromMm(
                  numOrNull(currentSpecs?.minimumFocusDistanceMm),
                )}
                onChange={(value) =>
                  handleFieldChange("minimumFocusDistanceMm", mmFromCm(value))
                }
              />
              {currentSpecs?.minimumFocusDistanceMm != null ? (
                <div className="text-muted-foreground pr-2 text-right text-xs">
                  {formatFocusDistance(currentSpecs.minimumFocusDistanceMm)}
                </div>
              ) : null}
            </div>
          )}
          {/* Has Focus Ring */}
          {showWhenMissing(initialSpecs?.hasFocusRing) && (
            <BooleanInput
              id="hasFocusRing"
              label="Has Focus Ring"
              checked={currentSpecs?.hasFocusRing ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasFocusRing", value)}
            />
          )}

          {/* Number of Elements */}
          {showWhenMissing(initialSpecs?.numberElements) && (
            <NumberInput
              id="numberElements"
              label="Number of Elements"
              value={numOrNull(currentSpecs?.numberElements)}
              onChange={(value) => handleFieldChange("numberElements", value)}
            />
          )}

          {/* Number of Element Groups */}
          {showWhenMissing(initialSpecs?.numberElementGroups) && (
            <NumberInput
              id="numberElementGroups"
              label="Number of Element Groups"
              value={numOrNull(currentSpecs?.numberElementGroups)}
              onChange={(value) =>
                handleFieldChange("numberElementGroups", value)
              }
            />
          )}

          {/* Has Diffractive Optics */}
          {showWhenMissing(initialSpecs?.hasDiffractiveOptics) && (
            <BooleanInput
              id="hasDiffractiveOptics"
              label="Has Diffractive Optics"
              checked={currentSpecs?.hasDiffractiveOptics ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasDiffractiveOptics", value)
              }
            />
          )}

          {/* Number of Diaphragm Blades */}
          {showWhenMissing(initialSpecs?.numberDiaphragmBlades) && (
            <NumberInput
              id="numberDiaphragmBlades"
              label="Number of Diaphragm Blades"
              value={numOrNull(currentSpecs?.numberDiaphragmBlades)}
              onChange={(value) =>
                handleFieldChange("numberDiaphragmBlades", value)
              }
            />
          )}

          {/* Has Rounded Diaphragm Blades */}
          {showWhenMissing(initialSpecs?.hasRoundedDiaphragmBlades) && (
            <BooleanInput
              id="hasRoundedDiaphragmBlades"
              label="Has Rounded Diaphragm Blades"
              checked={currentSpecs?.hasRoundedDiaphragmBlades ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasRoundedDiaphragmBlades", value)
              }
            />
          )}

          {/* Has Internal Zoom */}
          {showWhenMissing(initialSpecs?.hasInternalZoom) && (
            <BooleanInput
              id="hasInternalZoom"
              label="Has Internal Zoom"
              checked={
                isPrimeLens ? null : (currentSpecs?.hasInternalZoom ?? null)
              }
              disabled={isPrimeLens}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasInternalZoom", value)}
            />
          )}

          {/* Has Internal Focus */}
          {showWhenMissing(initialSpecs?.hasInternalFocus) && (
            <BooleanInput
              id="hasInternalFocus"
              label="Has Internal Focus"
              checked={currentSpecs?.hasInternalFocus ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasInternalFocus", value)}
            />
          )}

          {/* Front Element Rotates */}
          {showWhenMissing(initialSpecs?.frontElementRotates) && (
            <BooleanInput
              id="frontElementRotates"
              label="Front Element Rotates"
              checked={currentSpecs?.frontElementRotates ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("frontElementRotates", value)
              }
            />
          )}

          {/* Mount Material */}
          {showWhenMissing(initialSpecs?.mountMaterial) && (
            <div className="space-y-2">
              <Label htmlFor="mountMaterial">Mount Material</Label>
              <Select
                value={currentSpecs?.mountMaterial ?? ""}
                onValueChange={(value) =>
                  handleFieldChange("mountMaterial", value)
                }
              >
                <SelectTrigger id="mountMaterial" className="w-full">
                  <SelectValue placeholder="Select mount material" />
                </SelectTrigger>
                {/* TODO: add unknown option to all selects, or make custom select with X button to clear */}
                <SelectContent>
                  {ENUMS.mount_material_enum.map((mat) => (
                    <SelectItem key={mat} value={mat}>
                      {mat.charAt(0).toUpperCase() + mat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Has Weather Sealing */}
          {showWhenMissing(initialSpecs?.hasWeatherSealing) && (
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

          {/* Has Aperture Ring */}
          {showWhenMissing(initialSpecs?.hasApertureRing) && (
            <BooleanInput
              id="hasApertureRing"
              label="Has Aperture Ring"
              checked={currentSpecs?.hasApertureRing ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasApertureRing", value)}
            />
          )}

          {/* Number of Custom Control Rings */}
          {showWhenMissing(initialSpecs?.numberCustomControlRings) && (
            <NumberInput
              id="numberCustomControlRings"
              label="Number of Custom Control Rings"
              value={numOrNull(currentSpecs?.numberCustomControlRings)}
              onChange={(value) =>
                handleFieldChange("numberCustomControlRings", value)
              }
            />
          )}

          {/* Number of Function Buttons */}
          {showWhenMissing(initialSpecs?.numberFunctionButtons) && (
            <NumberInput
              id="numberFunctionButtons"
              label="Number of Function Buttons"
              value={numOrNull(currentSpecs?.numberFunctionButtons)}
              onChange={(value) =>
                handleFieldChange("numberFunctionButtons", value)
              }
            />
          )}

          {/* Accepts Filter Types */}
          {showWhenMissing(initialSpecs?.acceptsFilterTypes) && (
            <div
              id="acceptsFilterTypes"
              data-force-ring-container
              className="space-y-2 md:col-span-2"
            >
              <Label htmlFor="acceptsFilterTypes">Accepts Filter Types</Label>
              <MultiSelect
                inDialog
                options={ENUMS.lens_filter_types_enum.map((type) => ({
                  id: type,
                  name: formatFilterType(type),
                }))}
                value={
                  Array.isArray(currentSpecs?.acceptsFilterTypes)
                    ? currentSpecs.acceptsFilterTypes
                    : []
                }
                onChange={(value) =>
                  handleFieldChange("acceptsFilterTypes", value)
                }
              />
            </div>
          )}

          {/* Front Filter Thread Size */}
          {showWhenMissing(initialSpecs?.frontFilterThreadSizeMm) && (
            <NumberInput
              id="frontFilterThreadSizeMm"
              label="Front Filter Thread Size"
              suffix="mm"
              disabled={
                !currentSpecs?.acceptsFilterTypes?.includes("front-screw-on")
              }
              value={numOrNull(currentSpecs?.frontFilterThreadSizeMm)}
              onChange={(value) =>
                handleFieldChange("frontFilterThreadSizeMm", value)
              }
            />
          )}

          {/* Rear Filter Thread Size */}
          {showWhenMissing(initialSpecs?.rearFilterThreadSizeMm) && (
            <NumberInput
              id="rearFilterThreadSizeMm"
              label="Rear Filter Thread Size"
              suffix="mm"
              disabled={
                !currentSpecs?.acceptsFilterTypes?.includes("rear-screw-on")
              }
              value={numOrNull(currentSpecs?.rearFilterThreadSizeMm)}
              onChange={(value) =>
                handleFieldChange("rearFilterThreadSizeMm", value)
              }
            />
          )}

          {/* Drop In Filter Size */}
          {showWhenMissing(initialSpecs?.dropInFilterSizeMm) && (
            <NumberInput
              id="dropInFilterSizeMm"
              label="Drop In Filter Size"
              suffix="mm"
              disabled={
                !currentSpecs?.acceptsFilterTypes?.includes("rear-drop-in")
              }
              value={numOrNull(currentSpecs?.dropInFilterSizeMm)}
              onChange={(value) =>
                handleFieldChange("dropInFilterSizeMm", value)
              }
            />
          )}

          {/* Has Built In Teleconverter */}
          {showWhenMissing(initialSpecs?.hasBuiltInTeleconverter) && (
            <BooleanInput
              id="hasBuiltInTeleconverter"
              label="Has Built In Teleconverter"
              checked={currentSpecs?.hasBuiltInTeleconverter ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasBuiltInTeleconverter", value)
              }
            />
          )}

          {/* Has Lens Hood */}
          {showWhenMissing(initialSpecs?.hasLensHood) && (
            <BooleanInput
              id="hasLensHood"
              label="Has Lens Hood"
              checked={currentSpecs?.hasLensHood ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasLensHood", value)}
            />
          )}

          {/* Has Tripod Collar */}
          {showWhenMissing(initialSpecs?.hasTripodCollar) && (
            <BooleanInput
              id="hasTripodCollar"
              label="Has Tripod Collar"
              checked={currentSpecs?.hasTripodCollar ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasTripodCollar", value)}
            />
          )}

          {/* Is Tilt-Shift */}
          {showWhenMissing(initialSpecs?.isTiltShift) && (
            <BooleanInput
              id="isTiltShift"
              label="Is Tilt-Shift"
              checked={currentSpecs?.isTiltShift ?? null}
              allowNull
              showStateText
              onChange={(value) => {
                handleFieldChange("isTiltShift", value);
                if (value !== true) {
                  // Clear dependent fields when not a tilt-shift lens
                  handleFieldChange("tiltDegrees", null);
                  handleFieldChange("shiftMm", null);
                }
              }}
            />
          )}

          {/* Tilt Degrees */}
          {showWhenMissing(initialSpecs?.tiltDegrees) && (
            <NumberInput
              id="tiltDegrees"
              label="Tilt"
              suffix="°"
              disabled={!isTiltShift}
              value={isTiltShift ? numOrNull(currentSpecs?.tiltDegrees) : null}
              onChange={(value) => handleFieldChange("tiltDegrees", value)}
              step={0.1}
              min={0}
            />
          )}

          {/* Shift mm */}
          {showWhenMissing(initialSpecs?.shiftMm) && (
            <NumberInput
              id="shiftMm"
              label="Shift"
              suffix="mm"
              disabled={!isTiltShift}
              value={isTiltShift ? numOrNull(currentSpecs?.shiftMm) : null}
              onChange={(value) => handleFieldChange("shiftMm", value)}
              step={0.1}
              min={0}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const LensFields = memo(LensFieldsComponent);
