"use client";

import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SENSOR_FORMATS } from "~/lib/constants";
import { sensorSlugFromId } from "~/lib/mapping/sensor-map";

// Types for the sensor format input
export interface SensorFormatInputProps {
  id: string;
  label: string;
  value?: string | null;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export interface SensorFormatInputConfig {
  id: string;
  label: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const SensorFormatInput = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "Select sensor format",
}: SensorFormatInputProps) => {
  // Convert value to slug if it's an ID, otherwise use as-is
  const getDisplaySlug = (val: string | null | undefined): string => {
    if (!val) return "";

    // Check if it's already a slug by looking for it in SENSOR_FORMATS
    const slugMatch = SENSOR_FORMATS.find((f) => f.slug === val);
    if (slugMatch) return val;

    // If not found as slug, try to convert from ID to slug
    const slugFromId = sensorSlugFromId(val);
    return slugFromId || val;
  };

  const displaySlug = getDisplaySlug(value);
  const displayName = displaySlug
    ? SENSOR_FORMATS.find((f) => f.slug === displaySlug)?.name
    : undefined;

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Select value={displaySlug} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          {displayName ? (
            <span className="text-sm">{displayName}</span>
          ) : (
            <span className="text-muted-foreground text-sm">{placeholder}</span>
          )}
        </SelectTrigger>
        <SelectContent>
          {SENSOR_FORMATS.map((format) => (
            <SelectItem key={format.slug} value={format.slug}>
              <div className="flex w-full flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{format.name}</span>
                  {/* <span className="text-muted-foreground text-xs"></span> */}
                </div>
                <span className="text-muted-foreground text-xs">
                  {format.crop_factor}x crop factor
                  {/* {format.description} */}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SensorFormatInput;
