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
  // Convert Date object or ISO string to YYYY-MM-DD format for input
  const formatDateForInput = useCallback(
    (date: string | null | undefined): string => {
      if (typeof date !== "string") return "";
      try {
        return new Date(date).toISOString()?.split("T")[0] ?? "";
      } catch {
        return "";
      }
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
