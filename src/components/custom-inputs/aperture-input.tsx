"use client";

import { useState, useEffect } from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// Types for the aperture input
export interface ApertureInputProps {
  id: string;
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export interface ApertureInputConfig {
  id: string;
  label: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

// Common aperture values in f-stops (sorted for proper stepping)
const COMMON_APERTURES = [
  1.2, 1.4, 1.8, 2.0, 2.8, 3.5, 4, 4.5, 5.6, 6.3, 8.0, 11, 16, 22,
];

const ApertureInput = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "e.g., 2.8",
}: ApertureInputProps) => {
  // Local state for the input value to allow intermediate typing
  const [inputValue, setInputValue] = useState(value ? value.toString() : "");

  // Update local input when prop value changes
  useEffect(() => {
    setInputValue(value ? value.toString() : "");
  }, [value]);

  // Find the current index in the aperture array
  const currentIndex = COMMON_APERTURES.findIndex(
    (aperture) => aperture === value,
  );

  // Handle step up (next aperture value)
  const handleStepUp = () => {
    if (currentIndex === -1) {
      // If no current value, start with the first aperture
      const firstAperture = COMMON_APERTURES[0];
      if (firstAperture !== undefined) {
        onChange(firstAperture);
      }
    } else if (currentIndex < COMMON_APERTURES.length - 1) {
      // Move to next aperture
      const nextAperture = COMMON_APERTURES[currentIndex + 1];
      if (nextAperture !== undefined) {
        onChange(nextAperture);
      }
    }
  };

  // Handle step down (previous aperture value)
  const handleStepDown = () => {
    if (currentIndex === -1) {
      // If no current value, start with the last aperture
      const lastAperture = COMMON_APERTURES[COMMON_APERTURES.length - 1];
      if (lastAperture !== undefined) {
        onChange(lastAperture);
      }
    } else if (currentIndex > 0) {
      // Move to previous aperture
      const prevAperture = COMMON_APERTURES[currentIndex - 1];
      if (prevAperture !== undefined) {
        onChange(prevAperture);
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <span className="text-muted-foreground text-sm font-medium">f/</span>
        </div>
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setInputValue(newValue);

            // Allow empty input
            if (newValue === "") {
              onChange(undefined);
              return;
            }

            // Only update the actual value when we have a valid number
            const val = parseFloat(newValue);
            if (!isNaN(val) && val > 0) {
              onChange(val);
            }
          }}
          onBlur={() => {
            // On blur, clean up and ensure we have a valid value
            const val = parseFloat(inputValue);
            if (!isNaN(val) && val > 0) {
              onChange(val);
              setInputValue(val.toString());
            } else {
              // If invalid, reset to current value
              setInputValue(value ? value.toString() : "");
            }
          }}
          disabled={disabled}
          className="pr-12 pl-8"
        />

        {/* Custom step controls that use aperture values */}
        <div className="absolute inset-y-0 right-0 flex flex-col">
          <button
            type="button"
            onClick={handleStepUp}
            disabled={
              disabled ||
              (currentIndex !== -1 &&
                currentIndex >= COMMON_APERTURES.length - 1)
            }
            className="text-muted-foreground hover:text-foreground border-border flex-1 border-b border-l px-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={handleStepDown}
            disabled={disabled || (currentIndex !== -1 && currentIndex <= 0)}
            className="text-muted-foreground hover:text-foreground border-border flex-1 border-l px-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApertureInput;
