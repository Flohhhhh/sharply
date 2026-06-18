"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { actionUpdateGearInstructionManualLink } from "~/server/gear/actions";

interface ManageInstructionManualModalProps {
  slug: string;
  initialLinkInstructionManual: string | null;
  trigger?: React.ReactNode;
}

export function ManageInstructionManualModal({
  slug,
  initialLinkInstructionManual,
  trigger,
}: ManageInstructionManualModalProps) {
  const t = useTranslations("gearDetail");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialLinkInstructionManual ?? "");
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (next) {
      setValue(initialLinkInstructionManual ?? "");
    }
    setOpen(next);
  }

  function handleSave() {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("invalid");
        }
      } catch {
        toast.error(t("instructionManual.invalidUrl"));
        return;
      }
    }

    startTransition(async () => {
      try {
        const result = await actionUpdateGearInstructionManualLink(slug, {
          linkInstructionManual: trimmed,
        });
        toast.success(
          result.linkInstructionManual
            ? t("instructionManual.saved")
            : t("instructionManual.removed"),
        );
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error &&
            error.message === "INVALID_INSTRUCTION_MANUAL_URL"
            ? t("instructionManual.invalidUrl")
            : t("instructionManual.updateFailed"),
        );
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      try {
        await actionUpdateGearInstructionManualLink(slug, {
          linkInstructionManual: null,
        });
        setValue("");
        toast.success(t("instructionManual.removed"));
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error &&
            error.message === "INVALID_INSTRUCTION_MANUAL_URL"
            ? t("instructionManual.invalidUrl")
            : t("instructionManual.updateFailed"),
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline">
            {t("instructionManual.modalTitle")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("instructionManual.modalTitle")}</DialogTitle>
          <DialogDescription>
            {t("instructionManual.modalDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instruction-manual-link">
              {t("instructionManual.fieldLabel")}
            </Label>
            <input
              id="instruction-manual-link"
              type="url"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={t("instructionManual.fieldPlaceholder")}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
            />
            <div className="space-y-2 text-xs">
              <div className="text-muted-foreground w-full max-w-full overflow-hidden">
                {initialLinkInstructionManual ? (
                  <>
                    <div className="font-medium">
                      {t("instructionManual.currentLink")}
                    </div>
                    <a
                      href={initialLinkInstructionManual}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={initialLinkInstructionManual}
                      className="mt-1 block w-full max-w-full truncate underline sm:max-w-[32rem]"
                    >
                      {initialLinkInstructionManual}
                    </a>
                  </>
                ) : (
                  t("instructionManual.noLink")
                )}
              </div>
              <ul className="text-muted-foreground list-disc space-y-1 pl-4">
                <li>{t("instructionManual.guidanceOfficialFiles")}</li>
                <li>{t("instructionManual.guidanceDirectUrls")}</li>
                <li>{t("instructionManual.guidanceAvoidMirrors")}</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            disabled={isPending || !initialLinkInstructionManual}
          >
            {t("instructionManual.remove")}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t("instructionManual.cancel")}
            </Button>
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {isPending
                ? t("instructionManual.saving")
                : t("instructionManual.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
