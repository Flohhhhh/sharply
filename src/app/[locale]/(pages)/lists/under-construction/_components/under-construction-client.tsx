"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { splitBrandsWithPriority } from "~/lib/brands";
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

type Option = {
  value: string;
  label: string;
  sortOrder?: number | null;
  totalCount: number;
  underConstructionCount: number;
};
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
  const { hoisted: priorityBrands, remaining: remainingBrands } = useMemo(
    () =>
      splitBrandsWithPriority(
        brands.map((brand) => ({
          ...brand,
          name: brand.label,
        })),
      ),
    [brands],
  );
  const showBrandDivider =
    priorityBrands.length > 0 && remainingBrands.length > 0;
  const orderedBrands = [...priorityBrands, ...remainingBrands];

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (brandId !== "all" && it.brandId !== brandId) return false;
      if (gearType !== "all" && it.gearType !== gearType) return false;
      if (missingImagesOnly && it.hasImage) return false;
      return true;
    });
  }, [items, brandId, gearType, missingImagesOnly]);

  return (
    <>
      <Collapsible className="mb-6">
        <CollapsibleTrigger className="group focus-visible:ring-ring w-full cursor-pointer rounded-sm text-left transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{t("catalogCompletion")}</p>
            <div className="flex items-center gap-2 text-sm tabular-nums">
              <span className="font-semibold">{summary.completedPercent}%</span>
              <span className="text-muted-foreground">
                {summary.completedCount}/{summary.totalCount}
              </span>
              <ChevronRight className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-90" />
            </div>
          </div>
          <Progress value={summary.completedPercent} className="h-2.5" />
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden">
          <div className="grid gap-x-8 gap-y-5 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            {orderedBrands.map((brand) => {
              const completedCount = Math.max(
                brand.totalCount - brand.underConstructionCount,
                0,
              );
              const completedPercent =
                brand.totalCount > 0
                  ? Math.round((completedCount / brand.totalCount) * 100)
                  : 0;

              return (
                <div key={brand.value} className="border-b pb-4">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium">
                      {brand.label}
                    </p>
                    <span className="text-muted-foreground text-xs font-medium tabular-nums">
                      {completedPercent}%
                    </span>
                  </div>
                  <Progress value={completedPercent} className="h-1.5" />
                  <p className="text-muted-foreground mt-2 text-xs tabular-nums">
                    {completedCount}/{brand.totalCount}
                  </p>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="w-[220px]" aria-label={t("brand")}>
              <SelectValue placeholder={t("allBrands")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allBrands")}</SelectItem>
              {priorityBrands.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
              {showBrandDivider ? <SelectSeparator /> : null}
              {remainingBrands.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={gearType} onValueChange={setGearType}>
            <SelectTrigger className="w-[160px]" aria-label={t("type")}>
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
