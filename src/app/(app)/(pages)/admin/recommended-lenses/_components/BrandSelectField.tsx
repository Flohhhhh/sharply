"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { splitBrandsWithPriority } from "~/lib/brands";

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
  const { hoisted, remaining } = useMemo(() => {
    const normalized = options.map((opt) => ({ ...opt, name: opt.label }));
    return splitBrandsWithPriority(normalized);
  }, [options]);
  const showDivider = hoisted.length > 0 && remaining.length > 0;

  return (
    <div>
      <input type="hidden" name={name} value={value} readOnly />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select brand" />
        </SelectTrigger>
        <SelectContent>
          {hoisted.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
          {showDivider ? <SelectSeparator /> : null}
          {remaining.map((opt) => (
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
