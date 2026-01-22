"use client";
import { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { BrandSelect } from "~/components/custom-inputs/brand-select";
import { MountSelect } from "~/components/custom-inputs/mount-select";
import { getMountIdFromSlug, getMountSlugById } from "~/lib/mapping/mounts-map";
import { Slider } from "~/components/ui/slider";
import { Separator } from "~/components/ui/separator";

// Slider curve: 1 = linear, higher = more weight to low prices (exponential).
const PRICE_SLIDER_CURVE = 3;

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

export function FiltersSidebar() {
  const [brand, setBrand] = useQueryState("brand");
  const [mount, setMount] = useQueryState("mount");
  const [sensorFormat, setSensorFormat] = useQueryState("sensorFormat");
  const [gearType, setGearType] = useQueryState("gearType");
  const [priceMin, setPriceMin] = useQueryState("priceMin");
  const [priceMax, setPriceMax] = useQueryState("priceMax");
  const [, setPage] = useQueryState("page");

  const PRICE_MAX = 20000; // USD

  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const min = Number(priceMin ?? 0);
    const max = Number(priceMax ?? 0);
    return [
      Number.isFinite(min) ? min : 0,
      Number.isFinite(max) && max > 0 ? max : PRICE_MAX,
    ];
  });

  useEffect(() => {
    const min = Number(priceMin ?? 0);
    const max = Number(priceMax ?? 0);
    setPriceRange([
      Number.isFinite(min) ? min : 0,
      Number.isFinite(max) && max > 0 ? max : PRICE_MAX,
    ]);
  }, [priceMin, priceMax]);

  const handleGearTypeChange = (value: string) => {
    // Remove the query param when "all" is selected to keep it undefined
    setGearType(value === "all" ? null : value);
    void setPage("1");
  };

  return (
    <div className="sticky top-24 mt-4 w-full space-y-4 border-r pr-6">
      <div className="text-xl font-bold">Filters</div>
      {/* Gear Type */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Gear Type</div>
        <RadioGroup
          defaultValue="all"
          value={gearType ?? "all"}
          onValueChange={handleGearTypeChange}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="all" id="gt-all" />
            <label htmlFor="gt-all">All</label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="camera" id="gt-camera" />
            <label htmlFor="gt-camera">Camera</label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="lens" id="gt-lens" />
            <label htmlFor="gt-lens">Lens</label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="analog-camera" id="gt-analog-camera" />
            <label htmlFor="gt-analog-camera">Analog Camera</label>
          </div>
        </RadioGroup>
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Brand</div>
        <BrandSelect
          value={brand ?? ""}
          onChange={(value) => {
            setBrand(value || null);
            void setPage("1");
          }}
          valueKey="slug"
          placeholder="Select a brand"
          className="w-full"
        />
      </div>

      {/* Mount */}
      <div className="space-y-2">
        <MountSelect
          value={mount ? (getMountIdFromSlug(mount) ?? null) : null}
          filterBrand={brand}
          onChange={(value) => {
            const slug =
              typeof value === "string"
                ? (getMountSlugById(value) ?? null)
                : null;
            setMount(slug || null);
            void setPage("1");
          }}
        />
      </div>

      {/* Price range */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Price range</div>
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
            void setPage("1");
          }}
        />
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>${priceRange[0]}</span>
          <span>
            {priceRange[1] && priceRange[1] < PRICE_MAX
              ? `$${priceRange[1]}`
              : "No max"}
          </span>
        </div>
      </div>

      <Separator />

      <section className="h-48 space-y-4">
        {gearType === "all" || !gearType ? (
          <div className="space-y-2">
            <span className="text-muted-foreground text-center text-sm">
              Select a gear type to see more filters
            </span>
          </div>
        ) : gearType === "camera" ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Sensor format</div>
          </div>
        ) : gearType === "lens" ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Lens type</div>
          </div>
        ) : gearType === "analog-camera" ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Analog camera type</div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
