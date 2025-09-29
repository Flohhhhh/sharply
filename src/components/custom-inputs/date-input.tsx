"use client";

import { useMemo, useCallback } from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";

interface DateInputProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DateInput({
  label,
  value,
  onChange,
  placeholder,
}: DateInputProps) {
  // Normalize to YYYY-MM-DD for ISO-like strings without coercing partial input
  const formatDateForInput = useCallback(
    (date: string | null | undefined): string => {
      if (!date) return "";
      // If already YYYY-MM-DD, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      // If it's an ISO datetime (e.g., 2025-09-29T00:00:00Z), take the date part only
      const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
      // Otherwise, avoid coercing user input (prevents 19xx while typing)
      return "";
    },
    [],
  );

  const formattedValue = useMemo(
    () => formatDateForInput(value),
    [formatDateForInput, value],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, "-")}>{label}</Label>
      <Input
        id={label.toLowerCase().replace(/\s+/g, "-")}
        type="date"
        value={formattedValue}
        onChange={handleChange}
        placeholder={placeholder || `Select ${label.toLowerCase()}`}
      />
    </div>
  );
}
