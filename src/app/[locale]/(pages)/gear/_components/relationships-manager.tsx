"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  GearSearchCombobox,
  type GearOption,
} from "~/components/gear/gear-search-combobox";
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
import { Label } from "~/components/ui/label";
import { actionUpdateGearRelationships } from "~/server/gear/actions";
import type {
  GearAlternativeRow,
  GearLineageRelationships,
} from "~/server/gear/service";

type LocalAlternative = Pick<
  GearAlternativeRow,
  "gearId" | "name" | "slug" | "brandName" | "isCompetitor"
>;
interface RelationshipsManagerProps {
  gearId: string;
  gearSlug: string;
  gearType: string;
  initialAlternatives: GearAlternativeRow[];
  initialLineage: GearLineageRelationships;
  trigger?: React.ReactNode;
}

const toOption = (
  item: GearLineageRelationships["predecessor"],
): GearOption | null =>
  item
    ? {
        id: item.gearId,
        name: item.name,
        slug: item.slug,
        brandName: item.brandName,
        gearType: item.gearType,
      }
    : null;
const toAlternatives = (items: GearAlternativeRow[]): LocalAlternative[] =>
  items.map(({ gearId, name, slug, brandName, isCompetitor }) => ({
    gearId,
    name,
    slug,
    brandName,
    isCompetitor,
  }));

export function RelationshipsManager({
  gearId,
  gearSlug,
  gearType,
  initialAlternatives,
  initialLineage,
  trigger,
}: RelationshipsManagerProps) {
  const t = useTranslations("gearDetail.relationships");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [alternatives, setAlternatives] = useState<LocalAlternative[]>(() =>
    toAlternatives(initialAlternatives),
  );
  const [selectedAlternative, setSelectedAlternative] =
    useState<GearOption | null>(null);
  const [predecessor, setPredecessor] = useState<GearOption | null>(() =>
    toOption(initialLineage.predecessor),
  );
  const [successor, setSuccessor] = useState<GearOption | null>(() =>
    toOption(initialLineage.successor),
  );

  const reset = () => {
    setAlternatives(toAlternatives(initialAlternatives));
    setSelectedAlternative(null);
    setPredecessor(toOption(initialLineage.predecessor));
    setSuccessor(toOption(initialLineage.successor));
  };
  const changeOpen = (next: boolean) => {
    if (next) reset();
    setOpen(next);
  };
  const addAlternative = () => {
    if (!selectedAlternative) return;
    if (selectedAlternative.id === gearId) return toast.error(t("cannotSelf"));
    if (alternatives.some((item) => item.gearId === selectedAlternative.id))
      return toast.error(t("alreadyAlternative"));
    setAlternatives((items) => [
      ...items,
      {
        gearId: selectedAlternative.id,
        name: selectedAlternative.name,
        slug: selectedAlternative.slug,
        brandName: selectedAlternative.brandName ?? null,
        isCompetitor: false,
      },
    ]);
    setSelectedAlternative(null);
  };
  const save = () =>
    startTransition(async () => {
      try {
        await actionUpdateGearRelationships(gearSlug, {
          alternatives: alternatives.map(({ gearId, isCompetitor }) => ({
            gearId,
            isCompetitor,
          })),
          predecessorGearId: predecessor?.id ?? null,
          successorGearId: successor?.id ?? null,
        });
        toast.success(t("updated"));
        setOpen(false);
      } catch (error) {
        console.error("Failed to update gear relationships", error);
        toast.error(t("updateFailed"));
      }
    });
  const lineageExclusions = [gearId, predecessor?.id, successor?.id].filter(
    (id): id is string => Boolean(id),
  );

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            {t("title")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["predecessor", predecessor, setPredecessor, successor?.id],
                ["successor", successor, setSuccessor, predecessor?.id],
              ] as const
            ).map(([label, value, setter, otherId]) => (
              <div className="space-y-2" key={label}>
                <Label>{t(label)}</Label>
                <GearSearchCombobox
                  value={value}
                  setValue={setter}
                  placeholder={t(
                    `select${label[0]!.toUpperCase()}${label.slice(1)}`,
                  )}
                  searchPlaceholder={t("searchGear")}
                  allowClear
                  filters={{ gearType }}
                  excludeIds={[gearId, ...(otherId ? [otherId] : [])]}
                  inDialog
                />
                {value && (
                  <Link
                    href={`/gear/${value.slug}`}
                    target="_blank"
                    className="text-muted-foreground block truncate text-xs hover:underline"
                  >
                    {value.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label>{t("currentAlternatives")}</Label>
            {alternatives.length ? (
              <div className="divide-y rounded-md border">
                {alternatives.map((item) => (
                  <div
                    key={item.gearId}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <Link
                      href={`/gear/${item.slug}`}
                      target="_blank"
                      className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`competitor-${item.gearId}`}
                        checked={item.isCompetitor}
                        onCheckedChange={(checked) =>
                          setAlternatives((items) =>
                            items.map((value) =>
                              value.gearId === item.gearId
                                ? { ...value, isCompetitor: checked === true }
                                : value,
                            ),
                          )
                        }
                      />
                      <Label
                        htmlFor={`competitor-${item.gearId}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {t("competitor")}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("removeAlternative", { name: item.name })}
                        onClick={() =>
                          setAlternatives((items) =>
                            items.filter(
                              (value) => value.gearId !== item.gearId,
                            ),
                          )
                        }
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
                {t("noAlternatives")}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("addAlternative")}</Label>
            <div className="flex gap-2">
              <GearSearchCombobox
                value={selectedAlternative}
                setValue={setSelectedAlternative}
                placeholder={t("searchGear")}
                searchPlaceholder={t("searchGear")}
                allowClear
                fullWidth
                inDialog
                filters={{ gearType }}
                excludeIds={[
                  ...lineageExclusions,
                  ...alternatives.map((item) => item.gearId),
                ]}
              />
              <Button
                type="button"
                variant="outline"
                aria-label={t("addAlternative")}
                onClick={addAlternative}
                disabled={!selectedAlternative}
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
            {t("cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
