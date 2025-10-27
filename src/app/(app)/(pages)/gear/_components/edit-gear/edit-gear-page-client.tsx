"use client";

import { useState } from "react";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { EditGearForm } from "./edit-gear-form";
import type { GearItem } from "~/types/gear";

interface Props {
  gearType?: "CAMERA" | "LENS";
  gearSlug: string;
  gearData: GearItem;
  initialShowMissingOnly?: boolean;
}

export default function EditGearClient({
  gearType,
  gearSlug,
  gearData,
  initialShowMissingOnly,
}: Props) {
  const [showMissingOnly, setShowMissingOnly] = useState(
    Boolean(initialShowMissingOnly),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Label htmlFor="show-missing-only">Show missing only</Label>
        <Switch
          id="show-missing-only"
          checked={showMissingOnly}
          onCheckedChange={setShowMissingOnly}
        />
      </div>
      <EditGearForm
        gearType={gearType}
        gearData={gearData as any}
        gearSlug={gearSlug}
        showMissingOnly={showMissingOnly}
      />
    </div>
  );
}
