"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "~/components/ui/alert-dialog";
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
  const [isDirty, setIsDirty] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setConfirmExitOpen(true);
      return;
    }
    router.back();
  }, [isDirty, router]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        requestClose();
      }
    },
    [requestClose],
  );

  return (
    <Dialog defaultOpen open onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Gear: {gearName}</DialogTitle>
        </DialogHeader>
        <EditGearForm
          gearType={gearType}
          gearData={gearData}
          gearSlug={gearSlug}
          onDirtyChange={setIsDirty}
          onRequestClose={requestClose}
        />
      </DialogContent>
      {/* Unsaved changes confirmation */}
      <AlertDialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you exit now, your edits will be
              lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmExitOpen(false)}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmExitOpen(false);
                router.back();
              }}
            >
              Discard & Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
