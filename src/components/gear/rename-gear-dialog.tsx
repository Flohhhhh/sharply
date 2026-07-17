"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect,useMemo,useState,useTransition } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  actionRenameGear,
  actionUpdateGearAliases,
} from "~/server/admin/gear/actions";
import type { GearAlias } from "~/types/gear";
import {
  ALIAS_REGIONS,
  buildInitialAliasMap,
  buildRegionalAliasUpdates,
  getRenameGearDialogOpenState,
  type AliasMap,
} from "./rename-gear-dialog-utils";

const EMPTY_REGIONAL_ALIASES: GearAlias[] = [];

interface RenameGearDialogProps {
  gearId: string;
  currentName: string;
  currentSlug: string;
  regionalAliases?: GearAlias[];
  trigger?: React.ReactNode;
  onSuccess?: (result: { id: string; name: string; slug: string }) => void;
  /**
   * When true, show a checkbox that lets the user choose whether to navigate
   * to the gear page after a successful rename (useful in admin table).
   */
  showNavigateOption?: boolean;
  /**
   * Initial checked state for navigate-after-rename when the option is shown.
   * Defaults to false (stay on the current page).
   */
  defaultNavigateAfterRename?: boolean;
}

export function RenameGearDialog({
  gearId,
  currentName,
  currentSlug,
  regionalAliases,
  trigger,
  onSuccess,
  showNavigateOption = false,
  defaultNavigateAfterRename = false,
}: RenameGearDialogProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [aliases, setAliases] = useState<AliasMap>({});
  const [navigateAfterRename, setNavigateAfterRename] = useState(
    defaultNavigateAfterRename,
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("gearDetail.renameDialog");
  const stableRegionalAliases = regionalAliases ?? EMPTY_REGIONAL_ALIASES;

  const initialAliasMap = useMemo<AliasMap>(() => {
    return buildInitialAliasMap(stableRegionalAliases);
  }, [stableRegionalAliases]);
  const resetState = useMemo(
    () =>
      getRenameGearDialogOpenState({
        currentName,
        defaultNavigateAfterRename,
        regionalAliases: stableRegionalAliases,
      }),
    [currentName, defaultNavigateAfterRename, stableRegionalAliases],
  );

  const trimmedName = newName.trim();
  const trimmedAliases: AliasMap = Object.fromEntries(
    ALIAS_REGIONS.map((region) => [region, (aliases[region] ?? "").trim()]),
  );
  const nameChanged = trimmedName !== currentName;
  const aliasChanged = ALIAS_REGIONS.some((region) => {
    const nextVal = trimmedAliases[region] ?? "";
    const prevVal = initialAliasMap[region] ?? "";
    return nextVal !== prevVal;
  });
  const hasChanges = nameChanged || aliasChanged;

  // Sync input with current name when dialog opens or name changes
  useEffect(() => {
    if (open) {
      setNewName(resetState.newName);
      setNavigateAfterRename(resetState.navigateAfterRename);
      setAliases(resetState.aliases);
    }
  }, [open, resetState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trimmedName) {
      toast.error(t("enterNewName"));
      return;
    }

    if (!hasChanges) {
      toast.info(t("noChanges"));
      return;
    }

    startTransition(async () => {
      try {
        let resultSlug = currentSlug;
        let resultName = currentName;

        if (nameChanged) {
          const renameResult = await actionRenameGear({
            gearId,
            newName: trimmedName,
          });
          resultSlug = renameResult.slug;
          resultName = renameResult.name;
          setNewName(renameResult.name);
        }

        // Handle alias updates if changed
        if (aliasChanged) {
          await actionUpdateGearAliases({
            gearId,
            gearSlug: resultSlug,
            aliases: buildRegionalAliasUpdates(trimmedAliases),
          });
        }

        toast.success(
          nameChanged ? t("savedRenamed", { name: resultName }) : t("saved"),
        );
        setOpen(false);

        const shouldNavigate = showNavigateOption
          ? navigateAfterRename
          : resultSlug !== currentSlug;
        if (shouldNavigate && resultSlug !== currentSlug) {
          router.push(`/gear/${resultSlug}`);
        } else {
          router.refresh();
        }

        onSuccess?.({ id: gearId, name: resultName, slug: resultSlug });
      } catch (error) {
        const message = error instanceof Error ? error.message : t("failure");
        toast.error(message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">{t("trigger")}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-name" className="text-muted-foreground">
                {t("currentName")}
              </Label>
              <Input
                id="current-name"
                value={currentName}
                disabled
                className="font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-name">{t("newName")}</Label>
              <Input
                id="new-name"
                placeholder={t("newNamePlaceholder")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isPending}
                autoFocus
              />
              <p className="text-muted-foreground text-xs">
                {t("canonicalHelp")}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>{t("regionalAliases")}</Label>
              <p className="text-muted-foreground text-xs">
                {t("regionalHelp")}
              </p>
              <div className="grid gap-2">
                {ALIAS_REGIONS.map((region) => (
                  <div className="grid gap-1" key={region}>
                    <Label className="text-muted-foreground text-xs">
                      {region}
                    </Label>
                    <Input
                      placeholder={t("aliasPlaceholder", { region })}
                      value={aliases[region] ?? ""}
                      onChange={(e) =>
                        setAliases((prev) => ({
                          ...prev,
                          [region]: e.target.value,
                        }))
                      }
                      disabled={isPending}
                    />
                  </div>
                ))}
              </div>
            </div>
            {showNavigateOption ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="navigate-after-rename"
                  checked={navigateAfterRename}
                  onCheckedChange={(next) =>
                    setNavigateAfterRename(Boolean(next))
                  }
                  disabled={isPending}
                />
                <Label htmlFor="navigate-after-rename">
                  {t("navigateAfterRename")}
                </Label>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || !trimmedName || !hasChanges}
              loading={isPending}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
