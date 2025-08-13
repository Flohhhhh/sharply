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
  return (
    <div className={`w-full space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          {value ? (
            <span className="text-sm">
              {SENSOR_FORMATS.find((f) => f.slug === value)?.name}
            </span>
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
