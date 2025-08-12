"use client";

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
import type { CurrentSpecs } from "~/lib/gear-helpers";

interface CoreFieldsProps {
  currentSpecs: CurrentSpecs["core"];
  onChange: (section: string, field: string, value: any) => void;
}

export function CoreFields({ currentSpecs, onChange }: CoreFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateInput
            label="Release Date"
            value={currentSpecs.releaseDate ?? ""}
            onChange={(value) => onChange("core", "releaseDate", value)}
          />

          <PriceInput
            label="MSRP (USD)"
            value={currentSpecs.msrpUsdCents}
            onChange={(value) => onChange("core", "msrpUsdCents", value)}
          />

          <div className="space-y-2">
            <Label htmlFor="mount">Mount</Label>
            <Select
              value={currentSpecs.mountId ?? ""}
              onValueChange={(value) => onChange("core", "mountId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mount" />
              </SelectTrigger>
              <SelectContent>
                {MOUNTS.map((mount) => (
                  <SelectItem key={mount.id} value={mount.id}>
                    {getMountLongName(mount.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
