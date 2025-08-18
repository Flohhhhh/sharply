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
import { MOUNTS } from "~/lib/constants";
import MultiSelect from "~/components/ui/multi-select";
import { GENRES } from "~/lib/constants";
import { getMountLongName } from "~/lib/mapping/mounts-map";
import { centsToUsd, usdToCents } from "~/lib/utils";

interface CoreFieldsProps {
  currentSpecs: {
    releaseDate: Date | null;
    msrpUsdCents: number | null;
    mountId: string | null;
    weightGrams: number | null;
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

  const handlePriceChange = useCallback(
    (value: number | undefined) => {
      onChange("msrpUsdCents", usdToCents(value));
    },
    [onChange],
  );

  const handleWeightChange = useCallback(
    (value: number) => {
      onChange("weightGrams", value);
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

  // Safely format the price for the input (convert cents to dollars)
  const formattedPrice = useMemo(() => {
    return centsToUsd(currentSpecs.msrpUsdCents);
  }, [currentSpecs.msrpUsdCents]);

  // Safely format the weight for the input
  const formattedWeight = useMemo(() => {
    if (
      currentSpecs.weightGrams === null ||
      currentSpecs.weightGrams === undefined
    )
      return null;
    return currentSpecs.weightGrams;
  }, [currentSpecs.weightGrams]);

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
            id="msrp"
            label="MSRP (USD)"
            value={formattedPrice}
            onChange={handlePriceChange}
            placeholder="0.00"
            min={0}
          />

          <div className="space-y-2">
            <Label htmlFor="weight">Weight (grams)</Label>
            <input
              id="weight"
              type="number"
              value={formattedWeight || ""}
              onChange={(e) => handleWeightChange(Number(e.target.value) || 0)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter weight in grams"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mount">Mount</Label>
            <Select value={formattedMountId} onValueChange={handleMountChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select mount" />
              </SelectTrigger>
              <SelectContent>{mountOptions}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Use cases (genres)</Label>
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
