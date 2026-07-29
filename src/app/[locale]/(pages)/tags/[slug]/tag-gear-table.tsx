"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { GearTable, toGearTableRows } from "~/components/table";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { TagGearRow } from "~/server/tags/service";
import { filterTagGear } from "~/lib/tags/filter-tag-gear";

export function TagGearTable({ gear }: { gear: TagGearRow[] }) {
  const tTrending = useTranslations("trendingPage");
  const tUnderConstruction = useTranslations("underConstructionPage");
  const tTags = useTranslations("tags");
  const [gearType, setGearType] = useState("all");
  const [brand, setBrand] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const brands = useMemo(
    () =>
      Array.from(
        new Set(gear.map((item) => item.brandName).filter(Boolean) as string[]),
      ).sort(),
    [gear],
  );
  const filteredGear = useMemo(
    () =>
      filterTagGear(gear, searchQuery).filter(
        (item) =>
          (gearType === "all" || item.gearType === gearType) &&
          (brand === "all" || item.brandName === brand),
      ),
    [brand, gear, gearType, searchQuery],
  );
  const rows = useMemo(() => toGearTableRows(filteredGear), [filteredGear]);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={tTags("searchGear")}
          className="w-full sm:w-64"
        />
        <Select value={gearType} onValueChange={setGearType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={tUnderConstruction("type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tTrending("allGear")}</SelectItem>
            <SelectItem value="CAMERA">{tTrending("cameras")}</SelectItem>
            <SelectItem value="ANALOG_CAMERA">
              {tTrending("analogCameras")}
            </SelectItem>
            <SelectItem value="LENS">{tTrending("lenses")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={tUnderConstruction("brand")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {tUnderConstruction("allBrands")}
            </SelectItem>
            {brands.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-hidden rounded-md border">
        <GearTable rows={rows} initialSorting={[{ id: "year", desc: true }]} />
      </div>
    </div>
  );
}
