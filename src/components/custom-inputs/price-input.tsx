"use client";

import { useCallback } from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";

interface PriceInputProps {
  label: string;
  value: number | null | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
}

export function PriceInput({
  label,
  value,
  onChange,
  placeholder,
}: PriceInputProps) {
  // Convert cents to dollars for display
  const formatPriceForInput = useCallback(
    (cents: number | null | undefined): string => {
      if (cents === null || cents === undefined) return "";
      return (cents / 100).toFixed(2);
    },
    [],
  );

  // Convert dollars to cents for storage
  const handlePriceChange = useCallback(
    (inputValue: string) => {
      const dollars = parseFloat(inputValue);
      if (!isNaN(dollars) && dollars >= 0) {
        onChange(Math.round(dollars * 100));
      } else {
        onChange(0);
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, "-")}>{label}</Label>
      <Input
        id={label.toLowerCase().replace(/\s+/g, "-")}
        type="number"
        placeholder={placeholder || "0.00"}
        step="0.01"
        min="0"
        value={formatPriceForInput(value)}
        onChange={(e) => handlePriceChange(e.target.value)}
      />
    </div>
  );
}
