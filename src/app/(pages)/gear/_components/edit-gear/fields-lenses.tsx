"use client";

import { useCallback, memo } from "react";
import type { lensSpecs } from "~/server/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import FocalLengthInput from "~/components/custom-inputs/focal-length-input";

interface LensFieldsProps {
  currentSpecs: typeof lensSpecs.$inferSelect | null | undefined;
  onChange: (field: string, value: any) => void;
}

// Simple wrapper for standard number inputs (template)
const NumberInput = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  step,
  min,
  max,
}: {
  id: string;
  label: string;
  value?: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  step?: number;
  min?: number;
  max?: number;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <input
      id={id}
      type="number"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
);

function LensFieldsComponent({ currentSpecs, onChange }: LensFieldsProps) {
  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
      onChange(fieldId, value);
    },
    [onChange],
  );

  // component-local prime/zoom state handled inside FocalLengthInput

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lens Specifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <FocalLengthInput
            id="focalLength"
            label="Focal Length (mm)"
            minValue={currentSpecs?.focalLengthMinMm ?? null}
            maxValue={currentSpecs?.focalLengthMaxMm ?? null}
            onChange={({ focalLengthMinMm, focalLengthMaxMm }) => {
              handleFieldChange("focalLengthMinMm", focalLengthMinMm);
              handleFieldChange("focalLengthMaxMm", focalLengthMaxMm);
            }}
          />

          {/* Image Stabilization */}
          <div className="space-y-2">
            <Label htmlFor="hasStabilization">Image Stabilization</Label>
            <div className="flex items-center gap-3">
              <Switch
                id="hasStabilization"
                checked={Boolean(currentSpecs?.hasStabilization)}
                onCheckedChange={(checked) =>
                  handleFieldChange("hasStabilization", checked)
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const LensFields = memo(LensFieldsComponent);
