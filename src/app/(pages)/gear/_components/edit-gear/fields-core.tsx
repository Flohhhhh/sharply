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
import { DateInput, PriceInput } from "~/components/ui/inputs";
import { MOUNTS } from "~/lib/constants";
import { getMountLongName } from "~/lib/mapping/mounts-map";

interface CoreFieldsProps {
  currentSpecs: {
    releaseDate: Date | null;
    msrpUsdCents: number | null;
    mountId: string | null;
    weightGrams: number | null;
  };
  onChange: (section: string, field: string, value: any) => void;
}

function CoreFieldsComponent({ currentSpecs, onChange }: CoreFieldsProps) {
  const handleMountChange = useCallback(
    (value: string) => {
      onChange("core", "mountId", value);
    },
    [onChange],
  );

  const handleReleaseDateChange = useCallback(
    (value: string) => {
      onChange("core", "releaseDate", value ? new Date(value) : null);
    },
    [onChange],
  );

  const handlePriceChange = useCallback(
    (value: number) => {
      onChange("core", "msrpUsdCents", value);
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

  // Safely format the price for the input
  const formattedPrice = useMemo(() => {
    if (
      currentSpecs.msrpUsdCents === null ||
      currentSpecs.msrpUsdCents === undefined
    )
      return null;
    return currentSpecs.msrpUsdCents;
  }, [currentSpecs.msrpUsdCents]);

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

          <PriceInput
            label="MSRP (USD)"
            value={formattedPrice}
            onChange={handlePriceChange}
          />

          <div className="space-y-2">
            <Label htmlFor="mount">Mount</Label>
            <Select value={formattedMountId} onValueChange={handleMountChange}>
              <SelectTrigger>
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
