"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type Option = { value: string; label: string };

export function BrandSelectField({
  name = "brand",
  options,
  defaultValue = "",
}: {
  name?: string;
  options: Option[];
  defaultValue?: string;
}) {
  const [value, setValue] = useState<string>(defaultValue);
  return (
    <div>
      <input type="hidden" name={name} value={value} readOnly />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select brand" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default BrandSelectField;
