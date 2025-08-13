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
  // Convert ISO date string (or Date) to YYYY-MM-DD without timezone shifts
  const formatDateForInput = useCallback(
    (date: string | null | undefined): string => {
      if (!date) return "";
      // If already YYYY-MM-DD, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      // Fallback: parse and extract UTC date component
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return "";
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
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
