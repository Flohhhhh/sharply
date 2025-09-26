"use client";

import { useCallback, memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { DateInput } from "~/components/custom-inputs";
import CurrencyInput from "~/components/custom-inputs/currency-input";
import { NumberInput } from "~/components/custom-inputs/number-input";
import { MOUNTS } from "~/lib/constants";
import MultiSelect from "~/components/ui/multi-select";
import { GENRES } from "~/lib/constants";
import { getMountLongName } from "~/lib/mapping/mounts-map";
import { centsToUsd, usdToCents } from "~/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface CoreFieldsProps {
  currentSpecs: {
    releaseDate: Date | null;
    msrpNowUsdCents?: number | null;
    msrpAtLaunchUsdCents?: number | null;
    mpbMaxPriceUsdCents?: number | null;
    mountId: string | null;
    weightGrams: number | null;
    widthMm?: number | null;
    heightMm?: number | null;
    depthMm?: number | null;
    linkManufacturer?: string | null;
    linkMpb?: string | null;
    linkAmazon?: string | null;
    genres?: string[] | null;
  };
  onChange: (field: string, value: any) => void;
}

function CoreFieldsComponent({ currentSpecs, onChange }: CoreFieldsProps) {
  const handleMountChange = useCallback(
    (value: string) => {
      onChange("mountId", value);
    },
    [onChange],
  );

  const handleReleaseDateChange = useCallback(
    (value: string) => {
      if (!value) {
        onChange("releaseDate", null);
        return;
      }
      const [yStr, mStr, dStr] = value.split("-");
      const y = Number(yStr);
      const m = Number(mStr);
      const d = Number(dStr);
      const utcDate = new Date(Date.UTC(y, m - 1, d));
      onChange("releaseDate", utcDate);
    },
    [onChange],
  );

  const handleMsrpNowChange = useCallback(
    (value: number | undefined) => {
      onChange("msrpNowUsdCents", usdToCents(value));
    },
    [onChange],
  );

  const handleMsrpAtLaunchChange = useCallback(
    (value: number | undefined) => {
      onChange("msrpAtLaunchUsdCents", usdToCents(value));
    },
    [onChange],
  );

  const handleMpbMaxPriceChange = useCallback(
    (value: number | undefined) => {
      onChange("mpbMaxPriceUsdCents", usdToCents(value));
    },
    [onChange],
  );

  const handleLinkChange = useCallback(
    (field: "linkManufacturer" | "linkMpb" | "linkAmazon", value: string) => {
      const v = value.trim();
      onChange(field, v.length ? v : null);
    },
    [onChange],
  );

  const mountOptions = useMemo(
    () =>
      MOUNTS.map((mount) => (
        <SelectItem key={mount.id} value={mount.id}>
          {getMountLongName(mount.value)}
        </SelectItem>
      )),
    [],
  );

  // Safely format the date for the input
  const formattedReleaseDate = useMemo(() => {
    if (!currentSpecs.releaseDate) return "";
    try {
      const d = currentSpecs.releaseDate;
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  }, [currentSpecs.releaseDate]);

  // Safely format the current MSRP and launch MSRP for the inputs (convert cents to dollars)
  const formattedMsrpNow = useMemo(() => {
    return centsToUsd(currentSpecs.msrpNowUsdCents);
  }, [currentSpecs.msrpNowUsdCents]);

  const formattedMsrpAtLaunch = useMemo(() => {
    return centsToUsd(currentSpecs.msrpAtLaunchUsdCents);
  }, [currentSpecs.msrpAtLaunchUsdCents]);

  const formattedMpbMaxPrice = useMemo(() => {
    return centsToUsd(currentSpecs.mpbMaxPriceUsdCents);
  }, [currentSpecs.mpbMaxPriceUsdCents]);

  // Safely format the weight for the input
  const formattedWeight = useMemo(() => {
    if (
      currentSpecs.weightGrams === null ||
      currentSpecs.weightGrams === undefined
    )
      return null;
    return currentSpecs.weightGrams;
  }, [currentSpecs.weightGrams]);

  const formattedWidth = useMemo(() => {
    return currentSpecs.widthMm != null ? currentSpecs.widthMm : null;
  }, [currentSpecs.widthMm]);

  const formattedHeight = useMemo(() => {
    return currentSpecs.heightMm != null ? currentSpecs.heightMm : null;
  }, [currentSpecs.heightMm]);

  const formattedDepth = useMemo(() => {
    return currentSpecs.depthMm != null ? currentSpecs.depthMm : null;
  }, [currentSpecs.depthMm]);

  // Safely format the mount value for the select
  const formattedMountId = useMemo(() => {
    return currentSpecs.mountId || "";
  }, [currentSpecs.mountId]);

  // Genres options and values
  const genreOptions = useMemo(
    () =>
      (GENRES as any[]).map((g) => ({
        id: (g.slug as string) ?? (g.id as string),
        name: (g.name as string) ?? ((g.slug as string) || ""),
      })),
    [],
  );
  const formattedGenres = useMemo(() => {
    return Array.isArray(currentSpecs.genres) ? currentSpecs.genres : [];
  }, [currentSpecs.genres]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateInput
            label="Release Date"
            value={formattedReleaseDate}
            onChange={handleReleaseDateChange}
          />

          <CurrencyInput
            id="msrpNow"
            label="MSRP now (USD)"
            value={formattedMsrpNow}
            onChange={handleMsrpNowChange}
            placeholder="0.00"
            min={0}
          />

          <CurrencyInput
            id="msrpAtLaunch"
            label="MSRP at launch (USD)"
            value={formattedMsrpAtLaunch}
            onChange={handleMsrpAtLaunchChange}
            placeholder="0.00"
            min={0}
          />

          <CurrencyInput
            id="mpbMaxPrice"
            label="MPB max price (USD)"
            value={formattedMpbMaxPrice}
            onChange={handleMpbMaxPriceChange}
            placeholder="0.00"
            min={0}
          />

          <NumberInput
            id="weight"
            label="Weight with battery"
            value={formattedWeight}
            onChange={(v) => onChange("weightGrams", v)}
            min={0}
            placeholder="Enter weight w/ battery"
            suffix="g"
            prefix="≈"
          />

          <div className="space-y-2">
            <Label htmlFor="mount">Mount</Label>
            <Select value={formattedMountId} onValueChange={handleMountChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select mount" />
              </SelectTrigger>
              <SelectContent>{mountOptions}</SelectContent>
            </Select>
          </div>

          {/* Dimensions */}
          <NumberInput
            id="widthMm"
            label="Width"
            value={formattedWidth}
            onChange={(v) => onChange("widthMm", v)}
            min={0}
            step={0.1}
            placeholder="e.g., 135.5"
            suffix="mm"
          />
          <NumberInput
            id="heightMm"
            label="Height"
            value={formattedHeight}
            onChange={(v) => onChange("heightMm", v)}
            min={0}
            step={0.1}
            placeholder="e.g., 98.2"
            suffix="mm"
          />
          <NumberInput
            id="depthMm"
            label="Depth"
            value={formattedDepth}
            onChange={(v) => onChange("depthMm", v)}
            min={0}
            step={0.1}
            placeholder="e.g., 75.8"
            suffix="mm"
          />

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <Label>Best use cases</Label>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Select use cases where this gear excels, not just the ones
                    where it can satisfy a need.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <MultiSelect
              options={genreOptions}
              value={formattedGenres}
              onChange={(ids) => onChange("genres", ids)}
              placeholder="Select use cases..."
              searchPlaceholder="Search genres..."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="linkManufacturer">Manufacturer Link</Label>
            <input
              id="linkManufacturer"
              type="url"
              value={currentSpecs.linkManufacturer || ""}
              onChange={(e) =>
                handleLinkChange("linkManufacturer", e.target.value)
              }
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="https://manufacturer.example.com/product"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="linkMpb">MPB Link</Label>
            <input
              id="linkMpb"
              type="url"
              value={currentSpecs.linkMpb || ""}
              onChange={(e) => handleLinkChange("linkMpb", e.target.value)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="https://www.mpb.com/..."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="linkAmazon">Amazon Link</Label>
            <input
              id="linkAmazon"
              type="url"
              value={currentSpecs.linkAmazon || ""}
              onChange={(e) => handleLinkChange("linkAmazon", e.target.value)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="https://amazon.com/..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const CoreFields = memo(CoreFieldsComponent);
