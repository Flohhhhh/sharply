"use client";

import { useLocale } from "next-intl";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { formatIsoOption } from "~/lib/format/iso";

// Types for the ISO input
export interface IsoInputProps {
  id: string;
  label: string;
  value?: number | null;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
  minValue?: number;
  maxValue?: number;
  allowClear?: boolean;
  clearLabel?: string;
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
  25600, 32000, 40000, 51200, 64000, 80000, 102400, 200000, 204800, 256000,
  320000, 409600, 512000, 640000, 819200, 1024000, 1280000, 1638400, 2048000,
  2560000, 3276800, 4096000, 5120000, 6553600,
];

const IsoInput = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  minValue,
  maxValue,
  allowClear = false,
  clearLabel = "Clear",
  className = "",
  placeholder = "Select ISO",
}: IsoInputProps) => {
  const locale = useLocale();

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ? value.toString() : ""}
        onValueChange={(selectedValue) => {
          if (selectedValue === "__clear__") {
            onChange(undefined);
            return;
          }
          const isoValue = parseInt(selectedValue);
          if (!isNaN(isoValue)) {
            onChange(isoValue);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowClear ? (
            <SelectItem value="__clear__">{clearLabel}</SelectItem>
          ) : null}
          {COMMON_ISO_VALUES.map((iso) => (
            <SelectItem
              key={iso}
              value={iso.toString()}
              disabled={
                (minValue !== undefined && iso < minValue) ||
                (maxValue !== undefined && iso > maxValue)
              }
            >
              {formatIsoOption(iso, locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default IsoInput;
