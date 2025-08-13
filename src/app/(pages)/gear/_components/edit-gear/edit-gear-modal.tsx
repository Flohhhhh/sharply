"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { EditGearForm } from "./edit-gear-form";
import type { GearItem } from "~/types/gear";

interface EditGearModalProps {
  gearType?: "CAMERA" | "LENS";
  gearData: GearItem;
  gearSlug: string;
  gearName: string;
}

export function EditGearModal({
  gearType,
  gearData,
  gearSlug,
  gearName,
}: EditGearModalProps) {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <Dialog defaultOpen open onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Gear: {gearName}</DialogTitle>
        </DialogHeader>
        <EditGearForm
          gearType={gearType}
          gearData={gearData}
          gearSlug={gearSlug}
        />
      </DialogContent>
    </Dialog>
  );
}
