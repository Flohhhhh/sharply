"use client";

import { useMemo, useState } from "react";
import { DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { EditGearForm } from "./edit-gear-form";
import type { GearItem } from "~/types/gear";

interface EditModalContentProps {
  gearType?: "CAMERA" | "LENS";
  gearSlug: string;
  gearName?: string;
  gearData: GearItem;
  onDirtyChange?: (dirty: boolean) => void;
  onRequestClose: (opts?: { force?: boolean }) => void;
  initialShowMissingOnly?: boolean;
  formId?: string;
}

export function EditModalContent({
  gearType,
  gearSlug,
  gearName,
  gearData,
  onDirtyChange,
  onRequestClose,
  initialShowMissingOnly,
  formId = "edit-gear-form",
}: EditModalContentProps) {
  const [showMissingOnly, setShowMissingOnly] = useState(
    Boolean(initialShowMissingOnly),
  );

  const preparedData = useMemo(() => {
    const base = gearData as any;
    return {
      ...base,
      ...(typeof base.mountIds === "undefined" && {
        mountIds: base.mountId ? [base.mountId] : [],
      }),
    } as GearItem;
  }, [gearData]);

  return (
    <div className="flex max-h-[90vh] flex-col">
      <div className="px-6 pt-6 pb-4">
        <DialogHeader>
          <DialogTitle>
            {gearName ? `Edit Gear: ${gearName}` : `Edit ${gearSlug}`}
          </DialogTitle>
        </DialogHeader>
      </div>
      <div className="overflow-y-auto p-6">
        <EditGearForm
          gearType={gearType}
          gearData={preparedData as any}
          gearSlug={gearSlug}
          onDirtyChange={onDirtyChange}
          onRequestClose={onRequestClose}
          showActions={false}
          formId={formId}
          showMissingOnly={showMissingOnly}
        />
      </div>
      <div className="bg-background border-t px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="edit-modal-show-missing-only">
              Show missing only
            </Label>
            <Switch
              id="edit-modal-show-missing-only"
              checked={showMissingOnly}
              onCheckedChange={setShowMissingOnly}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md border px-4 text-sm"
              onClick={() => onRequestClose()}
            >
              Cancel
            </button>
            <button
              type="submit"
              form={formId}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-4 text-sm"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditModalContent;
