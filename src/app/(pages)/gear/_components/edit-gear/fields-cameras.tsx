"use client";

import { useCallback, memo, useMemo } from "react";
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
import { SENSOR_FORMATS } from "~/lib/constants";
import ApertureInput from "~/components/custom-inputs/aperture-input";
import IsoInput from "~/components/custom-inputs/iso-input";
import SensorFormatInput from "~/components/custom-inputs/sensor-format-input";

interface CameraFieldsProps {
  currentSpecs: typeof cameraSpecs.$inferSelect | null | undefined;
  onChange: (field: string, value: any) => void;
}

// Simple wrapper for standard number inputs
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
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || null)}
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
);

function CameraFieldsComponent({ currentSpecs, onChange }: CameraFieldsProps) {
  // Debug logging
  console.log("CameraFieldsComponent - currentSpecs:", currentSpecs);

  // Use sensor formats from constants
  const sensorFormatOptions = useMemo(
    () =>
      SENSOR_FORMATS.map((format) => ({
        id: format.slug,
        name: format.name,
      })),
    [],
  );

  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
      console.log("handleFieldChange called:", { fieldId, value });
      onChange(fieldId, value);
    },
    [onChange],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Camera Specifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Sensor Format */}
          <SensorFormatInput
            id="sensorFormatId"
            label="Sensor Format"
            value={currentSpecs?.sensorFormatId}
            onChange={(value) => handleFieldChange("sensorFormatId", value)}
          />

          {/* Resolution - Standard Number Input */}
          <NumberInput
            id="resolutionMp"
            label="Resolution (MP)"
            value={
              currentSpecs?.resolutionMp
                ? parseFloat(currentSpecs.resolutionMp)
                : null
            }
            onChange={(value) => handleFieldChange("resolutionMp", value)}
            placeholder="e.g., 45.0"
            step={0.1}
            min={0}
          />

          {/* ISO Min */}
          <IsoInput
            id="isoMin"
            label="ISO Min"
            value={currentSpecs?.isoMin}
            onChange={(value) => handleFieldChange("isoMin", value)}
          />

          {/* ISO Max */}
          <IsoInput
            id="isoMax"
            label="ISO Max"
            value={currentSpecs?.isoMax}
            onChange={(value) => handleFieldChange("isoMax", value)}
          />

          {/* Max FPS RAW */}
          <NumberInput
            id="maxFpsRaw"
            label="Max FPS (RAW)"
            value={currentSpecs?.maxFpsRaw}
            onChange={(value) => handleFieldChange("maxFpsRaw", value)}
            placeholder="e.g., 20"
            min={1}
            max={120}
            step={1}
          />

          {/* Max FPS JPEG */}
          <NumberInput
            id="maxFpsJpg"
            label="Max FPS (JPEG)"
            value={currentSpecs?.maxFpsJpg}
            onChange={(value) => handleFieldChange("maxFpsJpg", value)}
            placeholder="e.g., 20"
            min={1}
            max={120}
            step={1}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(CameraFieldsComponent);
