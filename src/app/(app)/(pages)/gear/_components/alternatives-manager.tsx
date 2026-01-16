"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X, Plus, Swords } from "lucide-react";
import Link from "next/link";
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
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  GearSearchCombobox,
  type GearOption,
} from "~/components/gear/gear-search-combobox";
import { actionUpdateGearAlternatives } from "~/server/gear/actions";
import type { GearAlternativeRow } from "~/server/gear/service";

type LocalAlternative = {
  gearId: string;
  name: string;
  slug: string;
  brandName: string | null;
  isCompetitor: boolean;
};

interface AlternativesManagerProps {
  gearId: string;
  gearSlug: string;
  gearType: string;
  initialAlternatives: GearAlternativeRow[];
  trigger?: React.ReactNode;
}

export function AlternativesManager({
  gearId,
  gearSlug,
  gearType,
  initialAlternatives,
  trigger,
}: AlternativesManagerProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localAlternatives, setLocalAlternatives] = useState<LocalAlternative[]>(() =>
    initialAlternatives.map((alt) => ({
      gearId: alt.gearId,
      name: alt.name,
      slug: alt.slug,
      brandName: alt.brandName,
      isCompetitor: alt.isCompetitor,
    })),
  );
  const [selectedGear, setSelectedGear] = useState<GearOption | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      // Reset local state to initial values when opening
      setLocalAlternatives(
        initialAlternatives.map((alt) => ({
          gearId: alt.gearId,
          name: alt.name,
          slug: alt.slug,
          brandName: alt.brandName,
          isCompetitor: alt.isCompetitor,
        })),
      );
      setSelectedGear(null);
    }
    setOpen(next);
  }

  function handleAddAlternative() {
    if (!selectedGear) return;

    // Check if already exists
    if (localAlternatives.some((alt) => alt.gearId === selectedGear.id)) {
      toast.error("This item is already an alternative");
      return;
    }

    // Check if trying to add self
    if (selectedGear.id === gearId) {
      toast.error("Cannot add this item as its own alternative");
      return;
    }

    setLocalAlternatives((prev) => [
      ...prev,
      {
        gearId: selectedGear.id,
        name: selectedGear.name,
        slug: selectedGear.slug,
        brandName: selectedGear.brandName ?? null,
        isCompetitor: false,
      },
    ]);
    setSelectedGear(null);
  }

  function handleRemoveAlternative(altGearId: string) {
    setLocalAlternatives((prev) => prev.filter((alt) => alt.gearId !== altGearId));
  }

  function handleToggleCompetitor(altGearId: string, checked: boolean) {
    setLocalAlternatives((prev) =>
      prev.map((alt) =>
        alt.gearId === altGearId ? { ...alt, isCompetitor: checked } : alt,
      ),
    );
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await actionUpdateGearAlternatives(
          gearSlug,
          localAlternatives.map((alt) => ({
            gearId: alt.gearId,
            isCompetitor: alt.isCompetitor,
          })),
        );
        toast.success("Alternatives updated");
        setOpen(false);
      } catch (error) {
        console.error("Failed to update alternatives:", error);
        toast.error("Failed to update alternatives");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Swords className="size-4" />
            Alternatives
            {initialAlternatives.length > 0 && (
              <span className="bg-muted rounded-full px-1.5 py-0.5 text-xs">
                {initialAlternatives.length}
              </span>
            )}
          </Button>
        )}
      </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Alternatives</DialogTitle>
            <DialogDescription>
              Add gear items that are alternatives to this one. Mark direct
              competitors to distinguish them from adjacent options.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current alternatives list */}
            {localAlternatives.length > 0 ? (
              <div className="space-y-2">
                <Label>Current Alternatives</Label>
                <div className="divide-y rounded-md border">
                  {localAlternatives.map((alt) => (
                    <div
                      key={alt.gearId}
                      className="flex items-center justify-between gap-4 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/gear/${alt.slug}`}
                          target="_blank"
                          className="font-medium text-sm hover:underline truncate block"
                        >
                          {alt.name}
                        </Link>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`competitor-${alt.gearId}`}
                            checked={alt.isCompetitor}
                            onCheckedChange={(checked) =>
                              handleToggleCompetitor(alt.gearId, checked === true)
                            }
                          />
                          <Label
                            htmlFor={`competitor-${alt.gearId}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            Competitor
                          </Label>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAlternative(alt.gearId)}
                          className="size-8 text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
                No alternatives added yet
              </div>
            )}

            {/* Add new alternative */}
            <div className="space-y-2">
              <Label>Add Alternative</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <GearSearchCombobox
                    value={selectedGear}
                    setValue={setSelectedGear}
                    placeholder="Search for gear..."
                    searchPlaceholder="Type to search..."
                    allowClear
                    fullWidth
                    filters={{ gearType }}
                    excludeIds={[gearId, ...localAlternatives.map((a) => a.gearId)]}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAlternative}
                  disabled={!selectedGear}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
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
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
