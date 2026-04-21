"use client";

import { XIcon } from "lucide-react";
import { useMemo } from "react";
import { Label } from "~/components/ui/label";
import MultiSelect from "~/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { BRANDS,MOUNTS } from "~/lib/constants";
import { getMountLongName } from "~/lib/mapping/mounts-map";
import { cn } from "~/lib/utils";

type BrandOption = {
  id: string;
  name: string;
  slug: string;
};

type MountOption = {
  id: string;
  value: string;
  brand_id: string | null;
  created_at: string;
};

type OrderedMountOption =
  | { id: string; name: string }
  | { id: string; name: ""; type: "separator" };

interface MountSelectProps {
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  mode?: "single" | "multiple";
  label?: string;
  placeholder?: string;
  brandId?: string | null;
  filterBrand?: string | null;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
  allowClear?: boolean;
  clearLabel?: string;
}

export function MountSelect({
  value,
  onChange,
  mode = "single",
  label = "Mount",
  placeholder,
  filterBrand,
  disabled,
  showLabel = true,
  className,
  allowClear = false,
  clearLabel = "Clear selection",
}: MountSelectProps) {
  const clearValue = "__mount_clear__";
  const brandOptions = BRANDS as BrandOption[];
  const mountOptions = MOUNTS as MountOption[];

  const brandIdToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const brand of brandOptions) {
      map.set(brand.id, brand.name);
    }
    return map;
  }, [brandOptions]);

  const brandSlugToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const brand of brandOptions) {
      map.set(brand.slug, brand.id);
    }
    return map;
  }, [brandOptions]);

  const normalizedFilterBrandId = useMemo(() => {
    if (!filterBrand) return null;
    if (brandSlugToId.has(filterBrand)) return brandSlugToId.get(filterBrand)!;
    if (brandIdToName.has(filterBrand)) return filterBrand;
    return null;
  }, [filterBrand, brandIdToName, brandSlugToId]);

  const optionsWithBrand = useMemo(() => {
    const mapped = mountOptions.map((mount) => {
      const mountBrandId = mount.brand_id;
      const brandName = (mountBrandId && brandIdToName.get(mountBrandId)) || "Other";
      const createdAtStr = mount.created_at;
      const createdAtMs = createdAtStr ? new Date(createdAtStr).getTime() : 0;
      return {
        id: mount.id,
        name: getMountLongName(mount.value),
        brandName,
        createdAtMs,
        rawBrandId: mountBrandId ?? null,
      };
    }) as {
        id: string;
        name: string;
        brandName: string;
        createdAtMs: number;
        rawBrandId: string | null;
      }[];
    if (!normalizedFilterBrandId) return mapped;
    return mapped.filter((opt) => opt.rawBrandId === normalizedFilterBrandId);
  }, [brandIdToName, mountOptions, normalizedFilterBrandId]);

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

  const orderedOptions = useMemo<OrderedMountOption[]>(() => {
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
    const selectValue = singleValue ?? "";

    return (
      <div id="mount" className={cn("space-y-2", className)}>
        {showLabel && <Label htmlFor="mount">{label}</Label>}
        <Select
          value={selectValue}
          onValueChange={(nextValue) => {
            // Allow clearing the selection when the clear option is chosen.
            if (allowClear && nextValue === clearValue) {
              onChange("");
              return;
            }
            onChange(nextValue);
          }}
          disabled={disabled}
        >
          <SelectTrigger id="mount" className="w-full">
            <SelectValue placeholder={placeholder || "Select mount"} />
          </SelectTrigger>
          <SelectContent>
            {allowClear ? (
              <SelectItem
                value={clearValue}
                className="text-muted-foreground flex items-center justify-between gap-2"
              >
                <XIcon className="size-4" />
                {clearLabel}
              </SelectItem>
            ) : null}
            {allowClear && orderedOptions.length > 0 ? (
              <SelectSeparator />
            ) : null}
            {orderedOptions.map((opt) => {
              if ("type" in opt && opt.type === "separator") {
                return <SelectSeparator key={opt.id} />;
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
          options={orderedOptions}
          value={multiValue}
          onChange={(ids) => onChange(ids)}
          placeholder={placeholder || "Select compatible mounts..."}
          searchPlaceholder="Search mounts..."
        />
      </div>
    </div>
  );
}
