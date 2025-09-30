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

  const requestClose = useCallback(
    (opts?: { force?: boolean }) => {
      if (isDirty && !opts?.force) {
        setConfirmExitOpen(true);
        return;
      }
      router.back();
    },
    [isDirty, router],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        requestClose();
      }
    },
    [requestClose],
  );

  // console.log("[EditGearModal] gearData", gearData);

  return (
    <Dialog defaultOpen open onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 sm:max-w-4xl">
        <div className="flex max-h-[90vh] flex-col">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle>Edit Gear: {gearName}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="overflow-y-auto p-6">
            <EditGearForm
              gearType={gearType}
              gearData={
                {
                  ...gearData,
                  // Provide mountIds for prefill in modal if missing
                  ...(typeof (gearData as any).mountIds === "undefined" && {
                    mountIds: (gearData as any).mountId
                      ? [(gearData as any).mountId]
                      : [],
                  }),
                } as any
              }
              gearSlug={gearSlug}
              onDirtyChange={setIsDirty}
              onRequestClose={requestClose}
              showActions={false}
              formId="edit-gear-form"
            />
          </div>
          <div className="bg-background border-t px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md border px-4 text-sm"
                onClick={() => requestClose()}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-gear-form"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-4 text-sm"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
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
