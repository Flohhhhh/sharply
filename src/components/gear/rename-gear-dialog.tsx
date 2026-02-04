"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  actionRenameGear,
  actionUpdateGearAliases,
} from "~/server/admin/gear/actions";
import { toast } from "sonner";
import { Checkbox } from "~/components/ui/checkbox";
import type { GearAlias } from "~/types/gear";
import { type GearRegion } from "~/lib/gear/region";

type AliasMap = Partial<Record<GearRegion, string>>;

function ensureBrandPrefix(value: string, brandName: string | null): string {
  if (!brandName) return value;
  const normalizedValue = value.trim();
  const normalizedBrand = brandName.trim();
  if (!normalizedBrand) return normalizedValue;
  const lowerValue = normalizedValue.toLowerCase();
  const lowerBrand = normalizedBrand.toLowerCase();
  if (lowerValue.startsWith(lowerBrand)) return normalizedValue;
  return `${normalizedBrand} ${normalizedValue}`.trim();
}

interface RenameGearDialogProps {
  gearId: string;
  currentName: string;
  currentSlug: string;
  brandName?: string | null;
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
  brandName,
  regionalAliases = [],
  trigger,
  onSuccess,
  showNavigateOption = false,
  defaultNavigateAfterRename = false,
}: RenameGearDialogProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const ALIAS_REGIONS: GearRegion[] = ["EU", "JP"];
  const [aliases, setAliases] = useState<AliasMap>({});
  const [navigateAfterRename, setNavigateAfterRename] = useState(
    defaultNavigateAfterRename,
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const initialAliasMap = useMemo<AliasMap>(() => {
    const map: AliasMap = {};
    for (const entry of regionalAliases ?? []) {
      if (ALIAS_REGIONS.includes(entry.region as GearRegion)) {
        map[entry.region as GearRegion] = entry.name ?? "";
      }
    }
    return map;
  }, [regionalAliases]);

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
      setNewName(currentName);
      setNavigateAfterRename(defaultNavigateAfterRename);
      setAliases(initialAliasMap);
    }
  }, [open, currentName, defaultNavigateAfterRename, initialAliasMap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trimmedName) {
      toast.error("Please enter a new name");
      return;
    }

    if (!hasChanges) {
      toast.info("No changes to save");
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
          const brandAwareAliases = ALIAS_REGIONS.map((region) => {
            const raw = trimmedAliases[region] || "";
            return {
              region,
              name: raw ? ensureBrandPrefix(raw, brandName ?? null) : null,
            };
          });
          await actionUpdateGearAliases({
            gearId,
            gearSlug: resultSlug,
            aliases: brandAwareAliases,
          });
        }

        toast.success(
          `Saved${nameChanged ? ` — renamed to "${resultName}"` : ""}`,
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
        const message =
          error instanceof Error ? error.message : "Failed to rename gear";
        toast.error(message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Rename</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Gear Item</DialogTitle>
            <DialogDescription>
              Update the name of this gear item. The slug and search index will
              be automatically updated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-name" className="text-muted-foreground">
                Current Name
              </Label>
              <Input
                id="current-name"
                value={currentName}
                disabled
                className="font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-name">New Name</Label>
              <Input
                id="new-name"
                placeholder="Enter new name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isPending}
                autoFocus
              />
              <p className="text-muted-foreground text-xs">
                Brand prefix will be added automatically if not present.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Regional Aliases</Label>
              <p className="text-muted-foreground text-xs">
                Optional localized names for specific regions (leave blank to
                remove). Brand prefix will be added automatically.
              </p>
              <div className="grid gap-2">
                {ALIAS_REGIONS.map((region) => (
                  <div className="grid gap-1" key={region}>
                    <Label className="text-muted-foreground text-xs">
                      {region}
                    </Label>
                    <Input
                      placeholder={`Alias for ${region}`}
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
                  Go to item page after renaming
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !trimmedName || !hasChanges}
              loading={isPending}
            >
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
