"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import UnderConstructionTable from "./under-construction-table";

type Row = {
  id: string;
  slug: string;
  name: string;
  brandName: string | null;
  gearType: string;
  missingCount: number;
  missing: string[];
  completionPercent: number;
  createdAt: string | Date;
  underConstruction: boolean;
  brandId?: string | null;
};

type Option = { value: string; label: string };

export default function UnderConstructionClient({
  items,
  brands,
  types,
}: {
  items: Row[];
  brands: Option[];
  types: readonly string[];
}) {
  const [brandId, setBrandId] = useState<string>("all");
  const [gearType, setGearType] = useState<string>("all");

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (brandId !== "all" && (it as any).brandId !== brandId) return false;
      if (gearType !== "all" && it.gearType !== gearType) return false;
      return true;
    });
  }, [items, brandId, gearType]);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Brand</span>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-xs">Type</span>
          <Select value={gearType} onValueChange={setGearType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-8">
        <UnderConstructionTable items={filtered as any} />
      </div>
    </>
  );
}
