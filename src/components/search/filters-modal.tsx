"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter as FilterIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { mergeSearchParams } from "@utils/url";
import { SENSOR_FORMATS, MOUNTS, BRANDS } from "~/lib/constants";
import { getMountLongName } from "~/lib/mapping/mounts-map";

// Narrow generated constants to safe shapes to avoid `any`
const MOUNT_OPTIONS = MOUNTS as Array<{ id: string; value: string }>;
const SENSOR_OPTIONS = SENSOR_FORMATS as Array<{
  id: string;
  slug: string;
  name: string;
}>;
const BRAND_OPTIONS = BRANDS as Array<{ id: string; name: string }>;

function useSyncedParam(key: string, fallback: string | undefined = undefined) {
  const sp = useSearchParams();
  const [value, setValue] = useState<string>(sp.get(key) ?? fallback ?? "");
  useEffect(() => {
    setValue(sp.get(key) ?? fallback ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString(), key]);
  return [value, setValue] as const;
}

export function FiltersModal() {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  // Controlled filter values synced from URL
  const [gearType, setGearType] = useSyncedParam("gearType", "");
  const [mount, setMount] = useSyncedParam("mount", "");
  const [sensorFormat, setSensorFormat] = useSyncedParam("sensorFormat", "");
  const [brand, setBrand] = useSyncedParam("brand", "");

  const priceMinInitial = useMemo(() => Number(sp.get("priceMin") ?? 0), [sp]);
  const priceMaxInitial = useMemo(() => Number(sp.get("priceMax") ?? 0), [sp]);
  const [price, setPrice] = useState<[number, number]>([
    Number.isFinite(priceMinInitial) ? priceMinInitial : 0,
    Number.isFinite(priceMaxInitial) && priceMaxInitial > 0
      ? priceMaxInitial
      : 0,
  ]);

  // Keep local slider in sync on param changes
  useEffect(() => {
    const min = Number(sp.get("priceMin") ?? 0);
    const max = Number(sp.get("priceMax") ?? 0);
    setPrice([
      Number.isFinite(min) ? min : 0,
      Number.isFinite(max) && max > 0 ? max : 0,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  function pushParams(
    updates: Record<string, string | number | undefined | null>,
  ) {
    const existing = new URLSearchParams(sp.toString());
    const qs = mergeSearchParams(existing, { ...updates, page: 1 });
    const href = qs ? `/search?${qs}` : "/search";
    router.replace(href);
  }

  // Auto update on control changes (debounced by Radix on commit for slider via onValueCommit)
  function onChangeGearType(next: string) {
    setGearType(next);
    pushParams({ gearType: next || null });
  }
  function onChangeMount(next: string) {
    const v = next === "__any__" ? "" : next;
    setMount(v);
    pushParams({ mount: v || null });
  }
  function onChangeSensor(next: string) {
    const v = next === "__any__" ? "" : next;
    setSensorFormat(v);
    pushParams({ sensorFormat: v || null });
  }
  function onChangeBrand(next: string) {
    setBrand(next);
    pushParams({ brand: next || null });
  }

  const PRICE_MAX = 10000; // USD

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          icon={<FilterIcon className="h-4 w-4" />}
        >
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>

        {/* Gear Type */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Type of gear</div>
          <RadioGroup
            value={gearType}
            onValueChange={onChangeGearType}
            className="flex gap-2"
          >
            <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2">
              <RadioGroupItem value="" id="gt-all" />
              <span>Any</span>
            </label>
            <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2">
              <RadioGroupItem value="CAMERA" id="gt-camera" />
              <span>Camera</span>
            </label>
            <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2">
              <RadioGroupItem value="LENS" id="gt-lens" />
              <span>Lens</span>
            </label>
          </RadioGroup>
        </div>

        {/* Mount */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Mount</div>
          <Select value={mount} onValueChange={onChangeMount}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any mount" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any mount</SelectItem>
              {MOUNT_OPTIONS.map((m) => (
                <SelectItem key={m.id} value={m.value}>
                  {getMountLongName(m.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sensor Format */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Sensor format</div>
          <Select value={sensorFormat} onValueChange={onChangeSensor}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any sensor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any sensor</SelectItem>
              {SENSOR_OPTIONS.map((s) => (
                <SelectItem key={s.id} value={s.slug}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Brand</div>
          <Select
            value={brand || "__any__"}
            onValueChange={(v) => onChangeBrand(v === "__any__" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any brand</SelectItem>
              {BRAND_OPTIONS.map((b) => (
                <SelectItem key={b.id} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price range */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Price range</div>
          <Slider
            value={[
              Number.isFinite(price[0]) ? Number(price[0]) : 0,
              Number.isFinite(price[1]) && price[1] !== 0
                ? Number(price[1])
                : PRICE_MAX,
            ]}
            min={0}
            max={PRICE_MAX}
            step={50}
            onValueChange={(v: number[]) => {
              const [min = 0, max = PRICE_MAX] = v;
              setPrice([min, max]);
            }}
            onValueCommit={(v: number[]) => {
              const [min = 0, max = PRICE_MAX] = v;
              pushParams({
                priceMin: min > 0 ? min : null,
                priceMax: max && max < PRICE_MAX ? max : null,
              });
            }}
          />
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>${price[0]}</span>
            <span>{price[1] ? `$${price[1]}` : "No max"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            onClick={() => {
              pushParams({
                brand: null,
                mount: null,
                gearType: null,
                priceMin: null,
                priceMax: null,
                sensorFormat: null,
              });
              setGearType("");
              setMount("");
              setSensorFormat("");
              setBrand("");
              setPrice([0, 0]);
            }}
          >
            Clear all
          </Button>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
