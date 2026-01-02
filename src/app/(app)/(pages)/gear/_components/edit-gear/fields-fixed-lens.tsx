"use client";

import { memo, useCallback, useMemo } from "react";
import type { fixedLensSpecs } from "~/server/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import FocalLengthInput from "~/components/custom-inputs/focal-length-input";
import LensApertureInput from "~/components/custom-inputs/lens-aperture-input";
import { BooleanInput, NumberInput } from "~/components/custom-inputs";
import { SENSOR_FORMATS } from "~/lib/constants";

interface FixedLensFieldsProps {
  currentSpecs: typeof fixedLensSpecs.$inferSelect | null | undefined;
  initialSpecs?: typeof fixedLensSpecs.$inferSelect | null | undefined;
  showMissingOnly?: boolean;
  onChange: (field: string, value: any) => void;
  sectionId?: string;
}

function FixedLensFieldsComponent({
  currentSpecs,
  initialSpecs,
  showMissingOnly,
  onChange,
  sectionId,
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

  const isMissing = (v: unknown): boolean => {
    if (v == null) return true;
    if (typeof v === "string") return v.trim().length === 0;
    if (Array.isArray(v)) return v.length === 0;
    return false;
  };
  const showWhenMissing = (v: unknown): boolean =>
    !showMissingOnly || isMissing(v);

  const CLEAR_SENSOR_FORMAT_VALUE = "none";
  const sensorFormatOptions = useMemo(
    () =>
      (Array.isArray(SENSOR_FORMATS) ? SENSOR_FORMATS : [])
        .map((format) => {
          if (
            !format ||
            typeof format !== "object" ||
            typeof (format as any).id !== "string" ||
            typeof (format as any).name !== "string"
          )
            return null;
          return {
            id: (format as any).id as string,
            name: (format as any).name as string,
          };
        })
        .filter(
          (item): item is { id: string; name: string } =>
            !!item && item.id.length > 0 && item.name.length > 0,
        ),
    [],
  );

  return (
    <Card
      id={sectionId}
      className="rounded-md border-0 bg-transparent px-0 py-0"
    >
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">Integrated Lens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="flex flex-col gap-3">
          {showWhenMissing(
            (initialSpecs as any)?.focalLengthMinMm ??
              (initialSpecs as any)?.focalLengthMaxMm,
          ) && (
            <FocalLengthInput
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
          )}

          {showWhenMissing(
            (initialSpecs as any)?.maxApertureWide ??
              (initialSpecs as any)?.maxApertureTele ??
              (initialSpecs as any)?.minApertureWide ??
              (initialSpecs as any)?.minApertureTele,
          ) && (
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
          )}

          {showWhenMissing((initialSpecs as any)?.imageCircleSize) && (
            <div className="space-y-2">
              <Label htmlFor="fixed-image-circle-size">Image Circle Size</Label>
              <Select
                value={
                  currentSpecs?.imageCircleSize ?? CLEAR_SENSOR_FORMAT_VALUE
                }
                onValueChange={(value) =>
                  handleFieldChange(
                    "imageCircleSize",
                    value === CLEAR_SENSOR_FORMAT_VALUE ? null : value,
                  )
                }
              >
                <SelectTrigger
                  id="fixed-image-circle-size"
                  className="w-full"
                >
                  <SelectValue placeholder="Select sensor format coverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CLEAR_SENSOR_FORMAT_VALUE}>None</SelectItem>
                  {sensorFormatOptions.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showWhenMissing((initialSpecs as any)?.hasAutofocus) && (
            <BooleanInput
              id="fixed-has-autofocus"
              label="Has Autofocus"
              checked={currentSpecs?.hasAutofocus ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasAutofocus", value)}
            />
          )}

          {showWhenMissing((initialSpecs as any)?.frontElementRotates) && (
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
          )}

          {showWhenMissing((initialSpecs as any)?.frontFilterThreadSizeMm) && (
            <NumberInput
              id="fixed-front-filter-thread-size-mm"
              label="Front Filter Thread Size"
              suffix="mm"
              value={numOrNull(currentSpecs?.frontFilterThreadSizeMm)}
              onChange={(value) =>
                handleFieldChange("frontFilterThreadSizeMm", value)
              }
            />
          )}

          {showWhenMissing((initialSpecs as any)?.minimumFocusDistanceMm) && (
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
          )}

          {showWhenMissing((initialSpecs as any)?.hasLensHood) && (
            <BooleanInput
              id="fixed-has-lens-hood"
              label="Has Lens Hood"
              checked={currentSpecs?.hasLensHood ?? null}
              allowNull
              showStateText
              onChange={(value) => handleFieldChange("hasLensHood", value)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const FixedLensFields = memo(FixedLensFieldsComponent);
