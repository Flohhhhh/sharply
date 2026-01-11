"use client";

import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// Types for the ISO input
export interface IsoInputProps {
  id: string;
  label: string;
  value?: number | null;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export interface IsoInputConfig {
  id: string;
  label: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

// Standard ISO value
const COMMON_ISO_VALUES = [
  50, 64, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250,
  1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800, 16000, 20000,
  25600, 32000, 40000, 51200, 64000, 80000, 102400, 200000,
];

const IsoInput = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "Select ISO",
}: IsoInputProps) => {
  return (
    <div className={`w-full space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ? value.toString() : ""}
        onValueChange={(selectedValue) => {
          const isoValue = parseInt(selectedValue);
          if (!isNaN(isoValue)) {
            onChange(isoValue);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {COMMON_ISO_VALUES.map((iso) => (
            <SelectItem key={iso} value={iso.toString()}>
              ISO {iso}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default IsoInput;
