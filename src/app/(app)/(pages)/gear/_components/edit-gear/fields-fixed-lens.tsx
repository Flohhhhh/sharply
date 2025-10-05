"use client";

import { memo, useCallback } from "react";
import type { fixedLensSpecs } from "~/server/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import FocalLengthInput from "~/components/custom-inputs/focal-length-input";
import LensApertureInput from "~/components/custom-inputs/lens-aperture-input";
import { BooleanInput, NumberInput } from "~/components/custom-inputs";

interface FixedLensFieldsProps {
  currentSpecs: typeof fixedLensSpecs.$inferSelect | null | undefined;
  onChange: (field: string, value: any) => void;
}

function FixedLensFieldsComponent({
  currentSpecs,
  onChange,
}: FixedLensFieldsProps) {
  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
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

  const cmFromMm = (mm: number | null): number | null => {
    if (mm == null) return null;
    return mm / 10;
  };
  const mmFromCm = (cm: number | null): number | null => {
    if (cm == null) return null;
    return Math.round(cm * 10);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrated Lens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FocalLengthInput
            className="col-span-2"
            id="fixed-focal-length"
            label="Focal Length (mm)"
            minValue={currentSpecs?.focalLengthMinMm ?? null}
            maxValue={currentSpecs?.focalLengthMaxMm ?? null}
            onChange={({ focalLengthMinMm, focalLengthMaxMm, isPrime }) => {
              handleFieldChange("focalLengthMinMm", focalLengthMinMm);
              handleFieldChange("focalLengthMaxMm", focalLengthMaxMm);
              handleFieldChange("isPrime", isPrime);
            }}
          />

          <LensApertureInput
            className="col-span-2"
            id="fixed-lens-aperture"
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

          <BooleanInput
            id="fixed-has-autofocus"
            label="Has Autofocus"
            checked={currentSpecs?.hasAutofocus ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasAutofocus", value)}
          />

          <BooleanInput
            id="fixed-front-element-rotates"
            label="Front Element Rotates"
            checked={currentSpecs?.frontElementRotates ?? null}
            allowNull
            showStateText
            onChange={(value) =>
              handleFieldChange("frontElementRotates", value)
            }
          />

          <NumberInput
            id="fixed-front-filter-thread-size-mm"
            label="Front Filter Thread Size"
            suffix="mm"
            value={numOrNull(currentSpecs?.frontFilterThreadSizeMm)}
            onChange={(value) =>
              handleFieldChange("frontFilterThreadSizeMm", value)
            }
          />

          <NumberInput
            id="fixed-minimum-focus-distance"
            label="Minimum Focus Distance"
            suffix="cm"
            step={0.1}
            min={0}
            value={cmFromMm(numOrNull(currentSpecs?.minimumFocusDistanceMm))}
            onChange={(value) =>
              handleFieldChange("minimumFocusDistanceMm", mmFromCm(value))
            }
          />

          <BooleanInput
            id="fixed-has-lens-hood"
            label="Has Lens Hood"
            checked={currentSpecs?.hasLensHood ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasLensHood", value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export const FixedLensFields = memo(FixedLensFieldsComponent);
