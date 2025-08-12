"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { EditGearForm } from "./edit-gear-form";

interface EditGearModalProps {
  gearType?: "CAMERA" | "LENS";
  currentSpecs?: any;
}

export function EditGearModal({ gearType, currentSpecs }: EditGearModalProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Gear Specifications</DialogTitle>
        </DialogHeader>
        <EditGearForm gearType={gearType} currentSpecs={currentSpecs} />
      </DialogContent>
    </Dialog>
  );
}
