"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { EditGearForm } from "./edit-gear-form";
import type { CurrentSpecs } from "~/lib/gear-helpers";

interface EditGearModalProps {
  gearType?: "CAMERA" | "LENS";
  currentSpecs?: CurrentSpecs;
  gearSlug: string;
  gearName: string;
}

export function EditGearModal({
  gearType,
  currentSpecs,
  gearSlug,
  gearName,
}: EditGearModalProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Gear: {gearName}</DialogTitle>
        </DialogHeader>
        <EditGearForm
          gearType={gearType}
          currentSpecs={currentSpecs}
          gearSlug={gearSlug}
        />
      </DialogContent>
    </Dialog>
  );
}
