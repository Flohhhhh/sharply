"use client";
import { parseAsNativeArrayOf, parseAsString, useQueryState } from "nuqs";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BrandSelect } from "~/components/custom-inputs/brand-select";
import IsoInput from "~/components/custom-inputs/iso-input";
import { MountSelect } from "~/components/custom-inputs/mount-select";
import {
  TagSelect,
  type TagSelectOption,
} from "~/components/custom-inputs/tag-select";
import SensorFormatInput from "~/components/custom-inputs/sensor-format-input";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import { ANALOG_OPTIONS } from "~/lib/mapping/analog-types-map";
import { getMountIdFromSlug, getMountSlugById } from "~/lib/mapping/mounts-map";
import { normalizeSearchGearTypeForUi } from "~/lib/search/gear-type-param";
import { DeferredNumberInput } from "./deferred-number-input";

// Slider curve: 1 = linear, higher = more weight to low prices (exponential).
const PRICE_SLIDER_CURVE = 3;
const MP_SLIDER_CURVE = 2;

function parseIsoValue(value: string | null): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeIsoRange(
  min: number | undefined,
  max: number | undefined,
): [number | undefined, number | undefined] {
  return min !== undefined && max !== undefined && min > max
    ? [max, min]
    : [min, max];
}

function priceToSlider(value: number, maxPrice: number) {
  const clamped = Math.max(0, Math.min(value, maxPrice));
  const ratio = clamped / maxPrice;
  const curved = Math.pow(ratio, 1 / PRICE_SLIDER_CURVE);
  return Math.round(curved * 1000);
}

function sliderToPrice(value: number, maxPrice: number) {
  const ratio = Math.max(0, Math.min(value, 1000)) / 1000;
  const price = Math.pow(ratio, PRICE_SLIDER_CURVE) * maxPrice;
  return Math.round(price);
}

function mpToSlider(value: number, maxMp: number) {
  const clamped = Math.max(0, Math.min(value, maxMp));
  const ratio = clamped / maxMp;
  const curved = Math.pow(ratio, 1 / MP_SLIDER_CURVE);
  return Math.round(curved * 1000);
}

function sliderToMp(value: number, maxMp: number) {
  const ratio = Math.max(0, Math.min(value, 1000)) / 1000;
  const mp = Math.pow(ratio, MP_SLIDER_CURVE) * maxMp;
  return Math.round(mp);
}

type FiltersSidebarProps = {
  idPrefix?: string;
  variant?: "sidebar" | "drawer";
  showTitle?: boolean;
  tagOptions: readonly TagSelectOption[];
};

export function FiltersSidebar({
  idPrefix = "",
  variant = "sidebar",
  showTitle = true,
  tagOptions,
}: FiltersSidebarProps) {
  const t = useTranslations("search");
  const id = (value: string) => `${idPrefix}${value}`;
  const [brand, setBrand] = useQueryState("brand");
  const [mount, setMount] = useQueryState("mount");
  const [sensorFormat, setSensorFormat] = useQueryState("sensorFormat");
  const [lensType, setLensType] = useQueryState("lensType");
  const [gearType, setGearType] = useQueryState("gearType");
  const [priceMin, setPriceMin] = useQueryState("priceMin");
  const [priceMax, setPriceMax] = useQueryState("priceMax");
  const [megapixelsMin, setMegapixelsMin] = useQueryState("megapixelsMin");
  const [megapixelsMax, setMegapixelsMax] = useQueryState("megapixelsMax");
  const [analogCameraType, setAnalogCameraType] =
    useQueryState("analogCameraType");
  const [focalIncludes, setFocalIncludes] = useQueryState("focalIncludes");
  const [widestFocalMax, setWidestFocalMax] = useQueryState("widestFocalMax");
  const [longestFocalMin, setLongestFocalMin] =
    useQueryState("longestFocalMin");
  const [fastestApertureMax, setFastestApertureMax] =
    useQueryState("fastestApertureMax");
  const [isoMin, setIsoMin] = useQueryState("isoMin");
  const [isoMax, setIsoMax] = useQueryState("isoMax");
  const [hasAutofocus, setHasAutofocus] = useQueryState("hasAutofocus");
  const [hasStabilization, setHasStabilization] =
    useQueryState("hasStabilization");
  const [hasIbis, setHasIbis] = useQueryState("hasIbis");
  const [hasWeatherSealing, setHasWeatherSealing] =
    useQueryState("hasWeatherSealing");
  const [tags, setTags] = useQueryState(
    "tag",
    parseAsNativeArrayOf(parseAsString).withDefault([]),
  );
  const normalizedGearType = normalizeSearchGearTypeForUi(gearType);
  const [selectedIsoMin, selectedIsoMax] = normalizeIsoRange(
    parseIsoValue(isoMin),
    parseIsoValue(isoMax),
  );

  const PRICE_MAX = 20000; // USD
  const MP_MAX = 100;

  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const min = Number(priceMin ?? 0);
    const max = Number(priceMax ?? 0);
    return [
      Number.isFinite(min) ? min : 0,
      Number.isFinite(max) && max > 0 ? max : PRICE_MAX,
    ];
  });

  const [megapixelsRange, setMegapixelsRange] = useState<[number, number]>(
    () => {
      const min = Number(megapixelsMin ?? 0);
      const max = Number(megapixelsMax ?? 100);
      return [
        Number.isFinite(min) ? min : 0,
        Number.isFinite(max) && max > 0 ? max : 100,
      ];
    },
  );

  useEffect(() => {
    const min = Number(priceMin ?? 0);
    const max = Number(priceMax ?? 0);
    setPriceRange([
      Number.isFinite(min) ? min : 0,
      Number.isFinite(max) && max > 0 ? max : PRICE_MAX,
    ]);
  }, [priceMin, priceMax]);

  useEffect(() => {
    const min = Number(megapixelsMin ?? 0);
    const max = Number(megapixelsMax ?? 100);
    setMegapixelsRange([
      Number.isFinite(min) ? min : 0,
      Number.isFinite(max) && max > 0 ? max : 100,
    ]);
  }, [megapixelsMin, megapixelsMax]);

  const handleGearTypeChange = (value: string) => {
    // Remove the query param when "all" is selected to keep it undefined
    void setGearType(value === "all" ? null : value);
    // Clear type-scoped filters when switching gear type
    void setSensorFormat(null);
    void setLensType(null);
    void setMegapixelsMin(null);
    void setMegapixelsMax(null);
    void setAnalogCameraType(null);
    void setFocalIncludes(null);
    void setWidestFocalMax(null);
    void setLongestFocalMin(null);
    void setFastestApertureMax(null);
    void setIsoMin(null);
    void setIsoMax(null);
    void setHasAutofocus(null);
    void setHasStabilization(null);
    void setHasIbis(null);
    void setHasWeatherSealing(null);
  };

  return (
    <div
      className={
        variant === "sidebar"
          ? "sticky top-24 mt-4 w-full space-y-4 border-r pr-6"
          : "w-full space-y-4"
      }
    >
      {showTitle ? (
        <div className="text-xl font-bold">{t("filters")}</div>
      ) : null}
      {/* Gear Type */}
      <div className="space-y-2">
        <div className="text-sm font-medium">{t("typeOfGear")}</div>
        <RadioGroup
          defaultValue="all"
          value={normalizedGearType ?? "all"}
          onValueChange={handleGearTypeChange}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="all" id={id("gt-all")} />
            <label htmlFor={id("gt-all")}>{t("any")}</label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="camera" id={id("gt-camera")} />
            <label htmlFor={id("gt-camera")}>{t("camera")}</label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="lens" id={id("gt-lens")} />
            <label htmlFor={id("gt-lens")}>{t("lens")}</label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="analog-camera" id={id("gt-analog-camera")} />
            <label htmlFor={id("gt-analog-camera")}>{t("analogCamera")}</label>
          </div>
        </RadioGroup>
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <div className="text-sm font-medium">{t("brand")}</div>
        <BrandSelect
          value={brand ?? ""}
          onChange={(value) => {
            void setBrand(value || null);
            void setMount(null);
          }}
          valueKey="slug"
          placeholder={t("selectBrand")}
          className="w-full"
        />
      </div>

      {/* Mount */}
      <div className="space-y-2">
        <MountSelect
          value={mount ? (getMountIdFromSlug(mount) ?? null) : null}
          filterBrand={brand}
          allowClear
          onChange={(value) => {
            const slug =
              typeof value === "string"
                ? (getMountSlugById(value) ?? null)
                : null;
            void setMount(slug || null);
          }}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <div className="text-sm font-medium">{t("tags")}</div>
        <TagSelect
          tags={tagOptions}
          value={tags}
          onChange={(value) => void setTags(value)}
          placeholder={t("selectTags")}
          searchPlaceholder={t("searchTags")}
          emptyLabel={t("noTagsFound")}
          getRemoveLabel={(name) => t("removeTag", { name })}
          ariaLabel={t("tags")}
          inDialog={variant === "drawer"}
        />
      </div>

      {/* Price range */}
      <div className="space-y-2">
        <div className="text-sm font-medium">{t("priceRange")}</div>
        <Slider
          value={[
            priceToSlider(
              Number.isFinite(priceRange[0]) ? Number(priceRange[0]) : 0,
              PRICE_MAX,
            ),
            priceToSlider(
              Number.isFinite(priceRange[1]) && priceRange[1] !== 0
                ? Number(priceRange[1])
                : PRICE_MAX,
              PRICE_MAX,
            ),
          ]}
          min={0}
          max={1000}
          step={1}
          onValueChange={(v: number[]) => {
            const [minSlider = 0, maxSlider = 1000] = v;
            const min = sliderToPrice(minSlider, PRICE_MAX);
            const max = sliderToPrice(maxSlider, PRICE_MAX);
            setPriceRange([min, max]);
          }}
          onValueCommit={(v: number[]) => {
            const [minSlider = 0, maxSlider = 1000] = v;
            const min = sliderToPrice(minSlider, PRICE_MAX);
            const max = sliderToPrice(maxSlider, PRICE_MAX);
            setPriceRange([min, max]);
            void setPriceMin(min > 0 ? String(min) : null);
            void setPriceMax(max && max < PRICE_MAX ? String(max) : null);
          }}
        />
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>${priceRange[0]}</span>
          <span>
            {priceRange[1] && priceRange[1] < PRICE_MAX
              ? `$${priceRange[1]}`
              : t("noMax")}
          </span>
        </div>
      </div>

      <Separator className="my-8" />

      <section className="space-y-4">
        {normalizedGearType === "all" || !normalizedGearType ? (
          <div className="space-y-2">
            <span className="text-muted-foreground text-center text-sm">
              {t("selectGearTypeForFilters")}
            </span>
          </div>
        ) : normalizedGearType === "camera" ? (
          <>
            <div className="space-y-2">
              <SensorFormatInput
                id={id("sensor-format")}
                label={t("sensorFormat")}
                value={sensorFormat ?? null}
                onChange={(value: string | undefined) =>
                  void setSensorFormat(value || null)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={id("megapixels")}>{t("megapixels")}</Label>
              <Slider
                id={id("megapixels")}
                value={[
                  mpToSlider(megapixelsRange[0], MP_MAX),
                  mpToSlider(megapixelsRange[1], MP_MAX),
                ]}
                min={0}
                max={1000}
                step={1}
                onValueChange={(v: number[]) => {
                  const [minSlider = 0, maxSlider = 1000] = v;
                  const min = sliderToMp(minSlider, MP_MAX);
                  const max = sliderToMp(maxSlider, MP_MAX);
                  setMegapixelsRange([min, max]);
                }}
                onValueCommit={(v: number[]) => {
                  const [minSlider = 0, maxSlider = 1000] = v;
                  const min = sliderToMp(minSlider, MP_MAX);
                  const max = sliderToMp(maxSlider, MP_MAX);
                  setMegapixelsRange([min, max]);
                  void setMegapixelsMin(min > 0 ? String(min) : null);
                  void setMegapixelsMax(max < MP_MAX ? String(max) : null);
                }}
              />
              <div className="text-muted-foreground flex items-center justify-between text-sm">
                <span>{megapixelsRange[0]}MP</span>
                <span>
                  {megapixelsRange[1] && megapixelsRange[1] < MP_MAX
                    ? `${megapixelsRange[1]}MP`
                    : t("noMax")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("nativeIsoCoverage")}</Label>
              <div className="space-y-2">
                <IsoInput
                  id={id("minimum-iso")}
                  label={t("minimumIso")}
                  value={selectedIsoMin}
                  maxValue={selectedIsoMax}
                  allowClear
                  clearLabel={t("any")}
                  onChange={(value) => {
                    void setIsoMin(value ? String(value) : null);
                    if (
                      value !== undefined &&
                      selectedIsoMax !== undefined &&
                      value > selectedIsoMax
                    ) {
                      void setIsoMax(null);
                    }
                  }}
                />
                <IsoInput
                  id={id("maximum-iso")}
                  label={t("maximumIso")}
                  value={selectedIsoMax}
                  minValue={selectedIsoMin}
                  allowClear
                  clearLabel={t("any")}
                  onChange={(value) => {
                    void setIsoMax(value ? String(value) : null);
                    if (
                      value !== undefined &&
                      selectedIsoMin !== undefined &&
                      value < selectedIsoMin
                    ) {
                      void setIsoMin(null);
                    }
                  }}
                />
              </div>
            </div>
            <FilterCheckbox
              id={id("has-ibis")}
              label={t("hasIbis")}
              checked={hasIbis === "true"}
              onCheckedChange={(checked) =>
                void setHasIbis(checked ? "true" : null)
              }
            />
            <FilterCheckbox
              id={id("has-weather-sealing")}
              label={t("hasWeatherSealing")}
              checked={hasWeatherSealing === "true"}
              onCheckedChange={(checked) =>
                void setHasWeatherSealing(checked ? "true" : null)
              }
            />
          </>
        ) : normalizedGearType === "lens" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">{t("lensType")}</div>
              <Select
                value={lensType ?? ""}
                onValueChange={(value) =>
                  void setLensType(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectLensType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("any")}</SelectItem>
                  <SelectItem value="prime">{t("prime")}</SelectItem>
                  <SelectItem value="zoom">{t("zoom")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={id("focal-includes")}>{t("focalLength")}</Label>
              <DeferredNumberInput
                id={id("focal-includes")}
                value={focalIncludes ?? ""}
                onCommit={(value) => void setFocalIncludes(value)}
                placeholder={t("focalIncludesPlaceholder")}
              />
              <Collapsible>
                <CollapsibleTrigger className="text-muted-foreground focus-visible:ring-ring rounded-sm text-sm underline focus-visible:ring-1 focus-visible:outline-none">
                  {t("advanced")}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <Label htmlFor={id("widest-focal")}>
                    {t("widestFocalLength")}
                  </Label>
                  <DeferredNumberInput
                    id={id("widest-focal")}
                    value={widestFocalMax ?? ""}
                    onCommit={(value) => void setWidestFocalMax(value)}
                    placeholder={t("widestFocalPlaceholder")}
                  />
                  <Label htmlFor={id("longest-focal")}>
                    {t("longestFocalLength")}
                  </Label>
                  <DeferredNumberInput
                    id={id("longest-focal")}
                    value={longestFocalMin ?? ""}
                    onCommit={(value) => void setLongestFocalMin(value)}
                    placeholder={t("longestFocalPlaceholder")}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
            <div className="space-y-2">
              <Label htmlFor={id("fastest-aperture")}>
                {t("fastestAperture")}
              </Label>
              <DeferredNumberInput
                id={id("fastest-aperture")}
                value={fastestApertureMax ?? ""}
                onCommit={(value) => void setFastestApertureMax(value)}
                placeholder={t("fastestAperturePlaceholder")}
              />
            </div>
            <FilterCheckbox
              id={id("has-autofocus")}
              label={t("hasAutofocus")}
              checked={hasAutofocus === "true"}
              onCheckedChange={(checked) =>
                void setHasAutofocus(checked ? "true" : null)
              }
            />
            <FilterCheckbox
              id={id("has-stabilization")}
              label={t("hasStabilization")}
              checked={hasStabilization === "true"}
              onCheckedChange={(checked) =>
                void setHasStabilization(checked ? "true" : null)
              }
            />
          </div>
        ) : normalizedGearType === "analog-camera" ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("analogCameraType")}</div>
            <Select
              value={analogCameraType ?? ""}
              onValueChange={(value) => void setAnalogCameraType(value || null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectAnalogCameraType")} />
              </SelectTrigger>
              <SelectContent>
                {ANALOG_OPTIONS.cameraTypes.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function FilterCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </label>
  );
}
