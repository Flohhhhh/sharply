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
import EditModalContent from "./edit-modal-content";
import type { GearItem } from "~/types/gear";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

interface EditGearModalProps {
  gearType?: "CAMERA" | "LENS";
  gearData: GearItem;
  gearSlug: string;
  gearName: string;
  initialShowMissingOnly?: boolean;
}

export function EditGearModal({
  gearType,
  gearData,
  gearSlug,
  gearName,
  initialShowMissingOnly,
}: EditGearModalProps) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [showMissingOnly, setShowMissingOnly] = useState(
    Boolean(initialShowMissingOnly),
  );

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
        <EditModalContent
          gearType={gearType}
          gearData={gearData}
          gearSlug={gearSlug}
          gearName={gearName}
          onDirtyChange={setIsDirty}
          onRequestClose={requestClose}
          initialShowMissingOnly={showMissingOnly}
          formId="edit-gear-form"
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
