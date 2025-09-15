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

interface LensFieldsProps {
  currentSpecs: typeof lensSpecs.$inferSelect | null | undefined;
  onChange: (field: string, value: any) => void;
}

// Simple wrapper for standard number inputs (template)

function LensFieldsComponent({ currentSpecs, onChange }: LensFieldsProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lens Specifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 space-y-4 md:grid-cols-2">
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

          {/* Aperture input */}
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

          {/* Image Stabilization */}
          <BooleanInput
            id="hasStabilization"
            label="Has Image Stabilization"
            checked={currentSpecs?.hasStabilization ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasStabilization", value)}
          />

          {/* Has Stabilization Switch */}
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

          {/* CIPA Stabilization Rating Stops */}
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

          {/* Has Autofocus */}
          <BooleanInput
            id="hasAutofocus"
            label="Has Autofocus"
            checked={currentSpecs?.hasAutofocus ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasAutofocus", value)}
          />

          {/* Is Macro */}
          <BooleanInput
            id="isMacro"
            label="Is Macro"
            checked={currentSpecs?.isMacro ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("isMacro", value)}
          />

          {/* Magnification */}
          <NumberInput
            id="magnification"
            label="Magnification"
            suffix="x"
            value={numOrNull(currentSpecs?.magnification)}
            onChange={(value) => handleFieldChange("magnification", value)}
          />

          {/* Minimum Focus Distance */}
          <NumberInput
            id="minimumFocusDistanceMm"
            label="Minimum Focus Distance"
            tooltip="1m = 1000mm (eg. 2.5m = 2500mm)"
            suffix="mm"
            value={numOrNull(currentSpecs?.minimumFocusDistanceMm)}
            onChange={(value) =>
              handleFieldChange("minimumFocusDistanceMm", value)
            }
          />
          {/* Focus Motor Type */}
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

          {/* Has Focus Ring */}
          <BooleanInput
            id="hasFocusRing"
            label="Has Focus Ring"
            checked={currentSpecs?.hasFocusRing ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasFocusRing", value)}
          />

          {/* Has AF/MF Switch */}
          <BooleanInput
            id="hasAfMfSwitch"
            label="Has AF/MF Switch"
            checked={currentSpecs?.hasAfMfSwitch ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasAfMfSwitch", value)}
          />

          {/* Has Focus Limiter */}
          <BooleanInput
            id="hasFocusLimiter"
            label="Has Focus Limiter"
            checked={currentSpecs?.hasFocusLimiter ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasFocusLimiter", value)}
          />

          {/* Has Focus Recall Button */}
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

          {/* Number of Elements */}
          <NumberInput
            id="numberElements"
            label="Number of Elements"
            value={numOrNull(currentSpecs?.numberElements)}
            onChange={(value) => handleFieldChange("numberElements", value)}
          />

          {/* Number of Element Groups */}
          <NumberInput
            id="numberElementGroups"
            label="Number of Element Groups"
            value={numOrNull(currentSpecs?.numberElementGroups)}
            onChange={(value) =>
              handleFieldChange("numberElementGroups", value)
            }
          />

          {/* Has Diffractive Optics */}
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

          {/* Number of Diaphragm Blades */}
          <NumberInput
            id="numberDiaphragmBlades"
            label="Number of Diaphragm Blades"
            value={numOrNull(currentSpecs?.numberDiaphragmBlades)}
            onChange={(value) =>
              handleFieldChange("numberDiaphragmBlades", value)
            }
          />

          {/* Has Rounded Diaphragm Blades */}
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

          {/* Has Internal Zoom */}
          <BooleanInput
            id="hasInternalZoom"
            label="Has Internal Zoom"
            checked={currentSpecs?.hasInternalZoom ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasInternalZoom", value)}
          />

          {/* Has Internal Focus */}
          <BooleanInput
            id="hasInternalFocus"
            label="Has Internal Focus"
            checked={currentSpecs?.hasInternalFocus ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasInternalFocus", value)}
          />

          {/* Front Element Rotates */}
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

          {/* Mount Material */}
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

          {/* Has Weather Sealing */}
          <BooleanInput
            id="hasWeatherSealing"
            label="Has Weather Sealing"
            checked={currentSpecs?.hasWeatherSealing ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasWeatherSealing", value)}
          />

          {/* Has Aperture Ring */}
          <BooleanInput
            id="hasApertureRing"
            label="Has Aperture Ring"
            checked={currentSpecs?.hasApertureRing ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasApertureRing", value)}
          />

          {/* Number of Custom Control Rings */}
          <NumberInput
            id="numberCustomControlRings"
            label="Number of Custom Control Rings"
            value={numOrNull(currentSpecs?.numberCustomControlRings)}
            onChange={(value) =>
              handleFieldChange("numberCustomControlRings", value)
            }
          />

          {/* Number of Function Buttons */}
          <NumberInput
            id="numberFunctionButtons"
            label="Number of Function Buttons"
            value={numOrNull(currentSpecs?.numberFunctionButtons)}
            onChange={(value) =>
              handleFieldChange("numberFunctionButtons", value)
            }
          />

          {/* Accepts Filter Types */}
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

          {/* Front Filter Thread Size */}
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

          {/* Rear Filter Thread Size */}
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

          {/* Drop In Filter Size */}
          <NumberInput
            id="dropInFilterSizeMm"
            label="Drop In Filter Size"
            suffix="mm"
            disabled={
              !currentSpecs?.acceptsFilterTypes?.includes("rear-drop-in")
            }
            value={numOrNull(currentSpecs?.dropInFilterSizeMm)}
            onChange={(value) => handleFieldChange("dropInFilterSizeMm", value)}
          />

          {/* Has Built In Teleconverter */}
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

          {/* Has Lens Hood */}
          <BooleanInput
            id="hasLensHood"
            label="Has Lens Hood"
            checked={currentSpecs?.hasLensHood ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasLensHood", value)}
          />

          {/* Has Tripod Collar */}
          <BooleanInput
            id="hasTripodCollar"
            label="Has Tripod Collar"
            checked={currentSpecs?.hasTripodCollar ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasTripodCollar", value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export const LensFields = memo(LensFieldsComponent);
