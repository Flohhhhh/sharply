"use client";

import { useMemo } from "react";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "~/components/ui/select";
import MultiSelect from "~/components/ui/multi-select";
import { MOUNTS, BRANDS } from "~/lib/constants";
import { getMountLongName } from "~/lib/mapping/mounts-map";
import { cn } from "~/lib/utils";

interface MountSelectProps {
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  mode?: "single" | "multiple";
  label?: string;
  placeholder?: string;
  brandId?: string | null;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function MountSelect({
  value,
  onChange,
  mode = "single",
  label = "Mount",
  placeholder,
  brandId,
  disabled,
  showLabel = true,
  className,
}: MountSelectProps) {
  const brandIdToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of BRANDS as any[]) {
      map.set((b).id as string, (b).name as string);
    }
    return map;
  }, []);

  const optionsWithBrand = useMemo(() => {
    return (MOUNTS as any[]).map((mount: any) => {
      const mountBrandId = (mount).brand_id as string | undefined | null;
      const brandName =
        (mountBrandId && brandIdToName.get(mountBrandId)) || "Other";
      const createdAtStr = (mount).created_at as string | undefined;
      const createdAtMs = createdAtStr ? new Date(createdAtStr).getTime() : 0;
      return {
        id: (mount).id as string,
        name: getMountLongName((mount).value as string),
        brandName,
        createdAtMs,
        rawBrandId: mountBrandId ?? null,
      } as {
        id: string;
        name: string;
        brandName: string;
        createdAtMs: number;
        rawBrandId: string | null;
      };
    });
  }, [brandIdToName]);

  // Custom brand priority order, then alphabetical for the rest
  const brandPriority = useMemo(
    () => ["Canon", "Nikon", "Sony", "Fujifilm", "Leica", "Hasselblad"],
    [],
  );

  const groupedForSingle = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; createdAtMs: number }[]
    >();
    for (const o of optionsWithBrand) {
      const list = map.get(o.brandName) || [];
      list.push({ id: o.id, name: o.name, createdAtMs: o.createdAtMs });
      map.set(o.brandName, list);
    }
    const presentBrands = Array.from(map.keys());
    const prioritized = brandPriority.filter((b) => presentBrands.includes(b));
    const rest = presentBrands
      .filter((b) => !brandPriority.includes(b))
      .sort((a, b) => a.localeCompare(b));
    const restWithoutOther = rest.filter((b) => b !== "Other");
    const hasOther = presentBrands.includes("Other");
    const brandOrder = [
      ...prioritized,
      ...restWithoutOther,
      ...(hasOther ? ["Other"] : []),
    ];

    return brandOrder.map((brandName) => ({
      brandName,
      items: (map.get(brandName) || [])
        .slice()
        .sort((a, b) => a.createdAtMs - b.createdAtMs)
        .map(({ id, name }) => ({ id, name })),
    }));
  }, [optionsWithBrand, brandPriority]);

  const orderedOptions = useMemo(() => {
    return groupedForSingle.flatMap((g, idx, arr) => {
      const items = g.items.map(({ id, name }) => ({ id, name }));
      const isLast = idx === arr.length - 1;
      // Insert a separator marker after each group except the last
      return isLast
        ? items
        : [
            ...items,
            { id: `sep-${idx}`, name: "", type: "separator" as const },
          ];
    });
  }, [groupedForSingle]);

  // Single select mode
  if (mode === "single") {
    const singleValue = Array.isArray(value) ? value[0] || "" : value || "";

    return (
      <div id="mount" className={cn("space-y-2", className)}>
        {showLabel && <Label htmlFor="mount">{label}</Label>}
        <Select
          value={singleValue}
          onValueChange={(val) => onChange(val)}
          disabled={disabled}
        >
          <SelectTrigger id="mount" className="w-full">
            <SelectValue placeholder={placeholder || "Select mount"} />
          </SelectTrigger>
          <SelectContent>
            {orderedOptions.map((opt) => {
              if ((opt as any).type === "separator") {
                return <SelectSeparator key={(opt as any).id} />;
              }
              return (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Multiple select mode
  const multiValue = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div id="mount" className={cn("space-y-2", className)}>
      {showLabel && <Label>{label}</Label>}
      <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
        <MultiSelect
          options={orderedOptions as any}
          value={multiValue}
          onChange={(ids) => onChange(ids)}
          placeholder={placeholder || "Select compatible mounts..."}
          searchPlaceholder="Search mounts..."
        />
      </div>
    </div>
  );
}
