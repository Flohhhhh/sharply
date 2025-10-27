"use client";

import { useCallback, memo } from "react";
import type { lensSpecs } from "~/server/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import FocalLengthInput from "~/components/custom-inputs/focal-length-input";
import LensApertureInput from "~/components/custom-inputs/lens-aperture-input";
import { BooleanInput } from "~/components/custom-inputs";
import { NumberInput } from "~/components/custom-inputs";
import { Input } from "~/components/ui/input";
import { ENUMS } from "~/lib/constants";
import { MultiSelect } from "~/components/ui/multi-select";
import { formatFilterType } from "~/lib/mapping/filter-types-map";
import { formatFocusDistance } from "~/lib/mapping/focus-distance-map";

interface LensFieldsProps {
  currentSpecs: typeof lensSpecs.$inferSelect | null | undefined;
  initialSpecs?: typeof lensSpecs.$inferSelect | null | undefined;
  showMissingOnly?: boolean;
  onChange: (field: string, value: any) => void;
}

// Simple wrapper for standard number inputs (template)

function LensFieldsComponent({
  currentSpecs,
  initialSpecs,
  showMissingOnly,
  onChange,
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

  return (
    <Card className="rounded-md bg-transparent px-4 py-4">
      <CardHeader className="px-0">
        <CardTitle>Lens Specifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="grid grid-cols-1 gap-4 space-y-4 md:grid-cols-2">
          {showWhenMissing(
            (initialSpecs as any)?.focalLengthMinMm ??
              (initialSpecs as any)?.focalLengthMaxMm,
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
              }}
            />
          )}

          {/* Aperture input */}
          {showWhenMissing(
            (initialSpecs as any)?.maxApertureWide ??
              (initialSpecs as any)?.maxApertureTele ??
              (initialSpecs as any)?.minApertureWide ??
              (initialSpecs as any)?.minApertureTele,
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
          {showWhenMissing((initialSpecs as any)?.hasStabilization) && (
            <BooleanInput
              id="hasStabilization"
              label="Has Image Stabilization"
              checked={currentSpecs?.hasStabilization ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasStabilization", value)}
            />
          )}

          {/* Has Stabilization Switch */}
          {showWhenMissing((initialSpecs as any)?.hasStabilizationSwitch) && (
            <BooleanInput
              id="hasStabilizationSwitch"
              label="Has Stabilization Switch"
              checked={currentSpecs?.hasStabilizationSwitch ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasStabilizationSwitch", value)
              }
            />
          )}

          {/* CIPA Stabilization Rating Stops */}
          {showWhenMissing(
            (initialSpecs as any)?.cipaStabilizationRatingStops,
          ) && (
            <NumberInput
              className="col-span-2"
              id="cipaStabilizationRatingStops"
              label="CIPA Stabilization Rating Stops"
              suffix="stops"
              value={numOrNull(currentSpecs?.cipaStabilizationRatingStops)}
              onChange={(value) =>
                handleFieldChange("cipaStabilizationRatingStops", value)
              }
            />
          )}

          {/* Has Autofocus */}
          {showWhenMissing((initialSpecs as any)?.hasAutofocus) && (
            <BooleanInput
              id="hasAutofocus"
              label="Has Autofocus"
              checked={currentSpecs?.hasAutofocus ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasAutofocus", value)}
            />
          )}

          {/* Is Macro */}
          {showWhenMissing((initialSpecs as any)?.isMacro) && (
            <BooleanInput
              id="isMacro"
              label="Is Macro"
              checked={currentSpecs?.isMacro ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("isMacro", value)}
            />
          )}

          {/* Magnification */}
          {showWhenMissing((initialSpecs as any)?.magnification) && (
            <NumberInput
              id="magnification"
              label="Magnification"
              suffix="x"
              value={numOrNull(currentSpecs?.magnification)}
              onChange={(value) => handleFieldChange("magnification", value)}
            />
          )}

          {/* Minimum Focus Distance */}
          {showWhenMissing((initialSpecs as any)?.minimumFocusDistanceMm) && (
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
          {/* Focus Motor Type */}
          {showWhenMissing((initialSpecs as any)?.focusMotorType) && (
            <div className="space-y-2">
              <Label htmlFor="focusMotorType">Focus Motor Type</Label>
              <Input
                id="focusMotorType"
                value={currentSpecs?.focusMotorType ?? ""}
                onChange={(e) =>
                  handleFieldChange(
                    "focusMotorType",
                    (e.target as HTMLInputElement).value,
                  )
                }
              />
            </div>
          )}

          {/* Has Focus Ring */}
          {showWhenMissing((initialSpecs as any)?.hasFocusRing) && (
            <BooleanInput
              id="hasFocusRing"
              label="Has Focus Ring"
              checked={currentSpecs?.hasFocusRing ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasFocusRing", value)}
            />
          )}

          {/* Has AF/MF Switch */}
          {showWhenMissing((initialSpecs as any)?.hasAfMfSwitch) && (
            <BooleanInput
              id="hasAfMfSwitch"
              label="Has AF/MF Switch"
              checked={currentSpecs?.hasAfMfSwitch ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasAfMfSwitch", value)}
            />
          )}

          {/* Has Focus Limiter */}
          {showWhenMissing((initialSpecs as any)?.hasFocusLimiter) && (
            <BooleanInput
              id="hasFocusLimiter"
              label="Has Focus Limiter"
              checked={currentSpecs?.hasFocusLimiter ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasFocusLimiter", value)}
            />
          )}

          {/* Has Focus Recall Button */}
          {showWhenMissing((initialSpecs as any)?.hasFocusRecallButton) && (
            <BooleanInput
              id="hasFocusRecallButton"
              label="Has Focus Recall Button"
              checked={currentSpecs?.hasFocusRecallButton ?? null}
              allowNull
              showStateText
              onChange={(value) =>
                handleFieldChange("hasFocusRecallButton", value)
              }
            />
          )}

          {/* Number of Elements */}
          {showWhenMissing((initialSpecs as any)?.numberElements) && (
            <NumberInput
              id="numberElements"
              label="Number of Elements"
              value={numOrNull(currentSpecs?.numberElements)}
              onChange={(value) => handleFieldChange("numberElements", value)}
            />
          )}

          {/* Number of Element Groups */}
          {showWhenMissing((initialSpecs as any)?.numberElementGroups) && (
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
          {showWhenMissing((initialSpecs as any)?.hasDiffractiveOptics) && (
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
          {showWhenMissing((initialSpecs as any)?.numberDiaphragmBlades) && (
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
          {showWhenMissing(
            (initialSpecs as any)?.hasRoundedDiaphragmBlades,
          ) && (
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
          {showWhenMissing((initialSpecs as any)?.hasInternalZoom) && (
            <BooleanInput
              id="hasInternalZoom"
              label="Has Internal Zoom"
              checked={currentSpecs?.hasInternalZoom ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasInternalZoom", value)}
            />
          )}

          {/* Has Internal Focus */}
          {showWhenMissing((initialSpecs as any)?.hasInternalFocus) && (
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
          {showWhenMissing((initialSpecs as any)?.frontElementRotates) && (
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
          {showWhenMissing((initialSpecs as any)?.mountMaterial) && (
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

          {/* Has Aperture Ring */}
          {showWhenMissing((initialSpecs as any)?.hasApertureRing) && (
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
          {showWhenMissing((initialSpecs as any)?.numberCustomControlRings) && (
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
          {showWhenMissing((initialSpecs as any)?.numberFunctionButtons) && (
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
          {showWhenMissing((initialSpecs as any)?.acceptsFilterTypes) && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="acceptsFilterTypes">Accepts Filter Types</Label>
              <MultiSelect
                inDialog
                options={ENUMS.lens_filter_types_enum.map((type) => ({
                  id: type,
                  name: formatFilterType(type),
                }))}
                value={
                  Array.isArray((currentSpecs as any)?.acceptsFilterTypes)
                    ? ((currentSpecs as any).acceptsFilterTypes as string[])
                    : []
                }
                onChange={(value) =>
                  handleFieldChange("acceptsFilterTypes", value)
                }
              />
            </div>
          )}

          {/* Front Filter Thread Size */}
          {showWhenMissing((initialSpecs as any)?.frontFilterThreadSizeMm) && (
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
          {showWhenMissing((initialSpecs as any)?.rearFilterThreadSizeMm) && (
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
          {showWhenMissing((initialSpecs as any)?.dropInFilterSizeMm) && (
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
          {showWhenMissing((initialSpecs as any)?.hasBuiltInTeleconverter) && (
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
          {showWhenMissing((initialSpecs as any)?.hasLensHood) && (
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
          {showWhenMissing((initialSpecs as any)?.hasTripodCollar) && (
            <BooleanInput
              id="hasTripodCollar"
              label="Has Tripod Collar"
              checked={currentSpecs?.hasTripodCollar ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasTripodCollar", value)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const LensFields = memo(LensFieldsComponent);
