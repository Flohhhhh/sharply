"use client";

import { useState, useEffect } from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";

// Types for the currency input
export interface CurrencyInputProps {
  id: string;
  label: string;
  value?: number | null;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface CurrencyInputConfig {
  id: string;
  label: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

const CurrencyInput = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "0.00",
  min = 0,
  max,
}: CurrencyInputProps) => {
  // Format a number as currency string (e.g., 1234.56 -> "1,234.56")
  const formatCurrency = (num: number): string => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Parse currency string back to number, handling commas and decimals
  const parseCurrency = (str: string): number | undefined => {
    // Remove commas and parse
    const cleanStr = str.replace(/,/g, "");
    const val = parseFloat(cleanStr);
    return isNaN(val) ? undefined : val;
  };

  // Local state for the input value to allow intermediate typing
  const [inputValue, setInputValue] = useState(
    value ? formatCurrency(value) : "",
  );

  // Only update from prop on initial load or when value changes externally
  useEffect(() => {
    if (value && !inputValue) {
      setInputValue(formatCurrency(value));
    }
  }, [value, inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Allow empty input
    if (newValue === "") {
      setInputValue("");
      onChange(undefined);
      return;
    }

    // Allow numbers, decimals, and commas while typing; parse safely
    const sanitized = newValue.replace(/,/g, "");
    if (/^\d*\.?\d*$/.test(sanitized)) {
      setInputValue(newValue);

      // Convert to number and update using comma-safe parsing
      const numValue = parseCurrency(newValue);
      if (
        numValue !== undefined &&
        numValue >= min &&
        (!max || numValue <= max)
      ) {
        onChange(numValue);
      }
    }
  };

  const handleBlur = () => {
    // On blur, format the value properly
    if (inputValue === "") {
      onChange(undefined);
      return;
    }

    const numValue = parseCurrency(inputValue);
    if (
      numValue !== undefined &&
      numValue >= min &&
      (!max || numValue <= max)
    ) {
      onChange(numValue);
      // Format the final value nicely with commas and 2 decimals
      setInputValue(formatCurrency(numValue));
    } else {
      // If invalid, reset to current value or clear
      if (value) {
        setInputValue(formatCurrency(value));
      } else {
        setInputValue("");
      }
    }
  };

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <span className="text-muted-foreground text-sm font-medium">$</span>
        </div>
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          className="pl-8 text-right"
          inputMode="decimal"
        />
      </div>
    </div>
  );
};

export default CurrencyInput;
