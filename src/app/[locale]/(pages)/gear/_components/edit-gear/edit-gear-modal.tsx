"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback,useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent
} from "~/components/ui/dialog";
import { translateGearDetailWithFallback } from "~/lib/i18n/gear-detail";
import type { GearItem,GearType } from "~/types/gear";
import EditModalContent from "./edit-modal-content";

interface EditGearModalProps {
  canToggleAutoSubmit?: boolean;
  gearType?: GearType;
  gearData: GearItem;
  gearSlug: string;
  gearName: string;
  initialShowMissingOnly?: boolean;
}

export function EditGearModal({
  canToggleAutoSubmit = false,
  gearType,
  gearData,
  gearSlug,
  gearName,
  initialShowMissingOnly,
}: EditGearModalProps) {
  const t = useTranslations("gearDetail");
  const tf = (key: string, fallback: string) =>
    translateGearDetailWithFallback(t, key, fallback);
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [showMissingOnly] = useState(Boolean(initialShowMissingOnly));

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
      <DialogContent className="p-0 sm:max-w-4xl" showCloseButton={false}>
        <EditModalContent
          canToggleAutoSubmit={canToggleAutoSubmit}
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
            <AlertDialogTitle>
              {tf("editGear.discardTitle", "Discard unsaved changes?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tf(
                "editGear.discardDescription",
                "You have unsaved changes. If you exit now, your edits will be lost.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmExitOpen(false)}>
              {tf("editGear.stay", "Stay")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmExitOpen(false);
                router.back();
              }}
            >
              {tf("editGear.discardAndExit", "Discard & Exit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
