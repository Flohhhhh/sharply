"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const RATING_VALUES = [
  { value: "best value", label: "Best value" },
  { value: "best performance", label: "Best performance" },
  { value: "balanced", label: "Balanced" },
  { value: "situational", label: "Situational" },
] as const;

export function RatingSelectField({
  name = "rating",
  defaultValue,
  value,
  onValueChange,
  disabled,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  disabled?: boolean;
}) {
  const [v, setV] = useState<string | undefined>(defaultValue);
  const current = value !== undefined ? value : v;
  return (
    <div>
      <input type="hidden" name={name} value={current ?? ""} readOnly />
      <Select
        value={current}
        onValueChange={(val) =>
          onValueChange ? onValueChange(val) : setV(val)
        }
      >
        <SelectTrigger className="w-full" disabled={disabled}>
          <SelectValue placeholder="Select rating" />
        </SelectTrigger>
        <SelectContent>
          {RATING_VALUES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default RatingSelectField;
