"use client";
import { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { BrandSelect } from "~/components/custom-inputs/brand-select";
import { MountSelect } from "~/components/custom-inputs/mount-select";
import { getMountIdFromSlug, getMountSlugById } from "~/lib/mapping/mounts-map";
import { Slider } from "~/components/ui/slider";
import { Separator } from "~/components/ui/separator";
import SensorFormatInput from "~/components/custom-inputs/sensor-format-input";
import { ANALOG_OPTIONS } from "~/lib/mapping/analog-types-map";
import {
  SelectContent,
  SelectValue,
  Select,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";

// Slider curve: 1 = linear, higher = more weight to low prices (exponential).
const PRICE_SLIDER_CURVE = 3;
const MP_SLIDER_CURVE = 2;

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

export function FiltersSidebar() {
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
    setGearType(value === "all" ? null : value);
    // Clear type-scoped filters when switching gear type
    setSensorFormat(null);
    setLensType(null);
    setMegapixelsMin(null);
    setMegapixelsMax(null);
    setAnalogCameraType(null);
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
            setMount(null);
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
          allowClear
          onChange={(value) => {
            const slug =
              typeof value === "string"
                ? (getMountSlugById(value) ?? null)
                : null;
            setMount(slug || null);
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

      <Separator className="my-8" />

      <section className="h-48 space-y-4">
        {gearType === "all" || !gearType ? (
          <div className="space-y-2">
            <span className="text-muted-foreground text-center text-sm">
              Select a gear type to see more filters
            </span>
          </div>
        ) : gearType === "camera" ? (
          <>
            <div className="space-y-2">
              <SensorFormatInput
                id="sensor-format"
                label="Sensor format"
                value={sensorFormat ?? null}
                onChange={(value: string | undefined) =>
                  setSensorFormat(value || null)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="megapixels">Megapixels</Label>
              <Slider
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
                  setMegapixelsMin(min > 0 ? String(min) : null);
                  setMegapixelsMax(max < MP_MAX ? String(max) : null);
                }}
              />
              <div className="text-muted-foreground flex items-center justify-between text-sm">
                <span>{megapixelsRange[0]}MP</span>
                <span>
                  {megapixelsRange[1] && megapixelsRange[1] < MP_MAX
                    ? `${megapixelsRange[1]}MP`
                    : "No max"}
                </span>
              </div>
            </div>
          </>
        ) : gearType === "lens" ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Lens type</div>
            <Select
              value={lensType ?? ""}
              onValueChange={(value) =>
                setLensType(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a lens type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="prime">Prime</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : gearType === "analog-camera" ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Analog camera type</div>
            <Select
              value={analogCameraType ?? ""}
              onValueChange={(value) => setAnalogCameraType(value || null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an analog camera type" />
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
