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

// Standard ISO values (doubles each time)
const COMMON_ISO_VALUES = [
  50, 64, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200, 102400,
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
