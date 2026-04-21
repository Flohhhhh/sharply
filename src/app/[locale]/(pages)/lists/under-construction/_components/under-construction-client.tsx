"use client";

import { useTranslations } from "next-intl";
import { useMemo,useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { GEAR_TYPE_LABELS } from "~/lib/constants";
import UnderConstructionTable from "./under-construction-table";

type Row = {
  id: string;
  slug: string;
  name: string;
  brandName: string | null;
  thumbnailUrl: string | null;
  hasImage: boolean;
  gearType: string;
  missingCount: number;
  missing: string[];
  completionPercent: number;
  createdAt: string | Date;
  underConstruction: boolean;
  brandId?: string | null;
};

type Option = { value: string; label: string };
type Summary = {
  totalCount: number;
  underConstructionCount: number;
  completedCount: number;
  completedPercent: number;
};

export default function UnderConstructionClient({
  canToggleAutoSubmit = false,
  items,
  summary,
  brands,
  types,
}: {
  canToggleAutoSubmit?: boolean;
  items: Row[];
  summary: Summary;
  brands: Option[];
  types: readonly string[];
}) {
  const t = useTranslations("underConstructionPage");
  const [brandId, setBrandId] = useState<string>("all");
  const [gearType, setGearType] = useState<string>("all");
  const [missingImagesOnly, setMissingImagesOnly] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (brandId !== "all" && (it as any).brandId !== brandId) return false;
      if (gearType !== "all" && it.gearType !== gearType) return false;
      if (missingImagesOnly && it.hasImage) return false;
      return true;
    });
  }, [items, brandId, gearType, missingImagesOnly]);

  return (
    <>
      <div className="bg-card mb-6 rounded-lg border p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{t("catalogCompletion")}</p>
            <p className="text-muted-foreground text-xs">
              {t("catalogSummary", {
                underConstructionCount: summary.underConstructionCount,
                totalCount: summary.totalCount,
              })}
            </p>
          </div>
          <p className="text-sm font-semibold">{summary.completedPercent}%</p>
        </div>
        <Progress value={summary.completedPercent} className="h-2.5" />

      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{t("brand")}</span>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={t("allBrands")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allBrands")}</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-xs">{t("type")}</span>
          <Select value={gearType} onValueChange={setGearType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allTypes")}</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {/* Type cast needed because types is readonly string[] from server data */}
                  {GEAR_TYPE_LABELS[t as keyof typeof GEAR_TYPE_LABELS] ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="missing-images"
            checked={missingImagesOnly}
            onCheckedChange={(val) => setMissingImagesOnly(val === true)}
          />
          <label
            htmlFor="missing-images"
            className="text-muted-foreground text-xs"
          >
            {t("showItemsWithoutImages")}
          </label>
        </div>
      </div>
      <div className="mt-8">
        <UnderConstructionTable
          canToggleAutoSubmit={canToggleAutoSubmit}
          items={filtered as any}
        />
      </div>
    </>
  );
}
