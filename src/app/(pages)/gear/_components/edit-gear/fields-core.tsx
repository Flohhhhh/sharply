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
import { getMountLongName } from "~/lib/mapping/mounts-map";
import { centsToUsd, usdToCents } from "~/lib/utils";

interface CoreFieldsProps {
  currentSpecs: {
    releaseDate: Date | null;
    msrpUsdCents: number | null;
    mountId: string | null;
    weightGrams: number | null;
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
      onChange("releaseDate", value ? new Date(value) : null);
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
      return currentSpecs.releaseDate.toISOString().split("T")[0];
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
        </div>
      </CardContent>
    </Card>
  );
}

export const CoreFields = memo(CoreFieldsComponent);
