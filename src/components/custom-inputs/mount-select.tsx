"use client";

import { useMemo } from "react";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import MultiSelect from "~/components/ui/multi-select";
import { MOUNTS } from "~/lib/constants";
import { getMountLongName } from "~/lib/mapping/mounts-map";

interface MountSelectProps {
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  mode?: "single" | "multiple";
  label?: string;
  placeholder?: string;
}

export function MountSelect({
  value,
  onChange,
  mode = "single",
  label = "Mount",
  placeholder,
}: MountSelectProps) {
  const mountOptions = useMemo(
    () =>
      MOUNTS.map((mount) => ({
        id: mount.id,
        name: getMountLongName(mount.value),
      })),
    [],
  );

  // Single select mode
  if (mode === "single") {
    const singleValue = Array.isArray(value) ? value[0] || "" : value || "";

    return (
      <div className="space-y-2">
        <Label htmlFor="mount">{label}</Label>
        <Select value={singleValue} onValueChange={(val) => onChange(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder || "Select mount"} />
          </SelectTrigger>
          <SelectContent>
            {mountOptions.map((mount) => (
              <SelectItem key={mount.id} value={mount.id}>
                {mount.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Multiple select mode
  const multiValue = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <MultiSelect
        options={mountOptions}
        value={multiValue}
        onChange={(ids) => onChange(ids)}
        placeholder={placeholder || "Select compatible mounts..."}
        searchPlaceholder="Search mounts..."
      />
    </div>
  );
}
