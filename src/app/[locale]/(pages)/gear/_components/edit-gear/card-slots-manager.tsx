"use client";

import { useTranslations, type TranslationValues } from "next-intl";
import { useMemo,useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { MultiSelect } from "~/components/ui/multi-select";
import { translateGearDetailWithFallback } from "~/lib/i18n/gear-detail";
import { ENUMS } from "~/lib/constants";
import { formatCardSlotDetails,titleizeCardEnum } from "~/lib/mapping";

export type CardSlot = {
  slotIndex: number;
  supportedFormFactors: string[];
  supportedBuses: string[];
  supportedSpeedClasses?: string[];
};

interface CardSlotsManagerProps {
  value: CardSlot[] | undefined;
  onChange: (next: CardSlot[]) => void;
}

const titleizeEnum = titleizeCardEnum;

export default function CardSlotsManager({
  value,
  onChange,
}: CardSlotsManagerProps) {
  const t = useTranslations("gearDetail");
  const tf = (key: string, fallback: string, values?: TranslationValues) =>
    translateGearDetailWithFallback(t, key, fallback, values);
  const [open, setOpen] = useState(false);
  const [localSlots, setLocalSlots] = useState<CardSlot[]>(() => {
    const initial = Array.isArray(value) ? [...value] : [];
    const trimmed = initial.slice(0, 2);
    return trimmed.map((s, i) => ({
      slotIndex: i + 1,
      supportedFormFactors: Array.isArray(s.supportedFormFactors)
        ? s.supportedFormFactors
        : [],
      supportedBuses: Array.isArray(s.supportedBuses) ? s.supportedBuses : [],
      supportedSpeedClasses: Array.isArray(s.supportedSpeedClasses)
        ? s.supportedSpeedClasses
        : [],
    }));
  });

  const formFactorOptions = useMemo(
    () =>
      (ENUMS.card_form_factor_enum as readonly string[]).map((v) => ({
        id: v,
        name: titleizeEnum(v),
      })),
    [],
  );

  const busOptions = useMemo(
    () =>
      (ENUMS.card_bus_enum as readonly string[]).map((v) => ({
        id: v,
        name: titleizeEnum(v),
      })),
    [],
  );

  const speedClassOptions = useMemo(
    () =>
      (ENUMS.card_speed_class_enum as readonly string[]).map((v) => ({
        id: v,
        name: v.toUpperCase().replace("_", "-"),
      })),
    [],
  );

  function openDialog() {
    const initial = Array.isArray(value) ? [...value] : [];
    const trimmed = initial.slice(0, 2);
    const normalized = trimmed.map((s, i) => ({
      slotIndex: i + 1,
      supportedFormFactors: Array.isArray(s.supportedFormFactors)
        ? s.supportedFormFactors
        : [],
      supportedBuses: Array.isArray(s.supportedBuses) ? s.supportedBuses : [],
      supportedSpeedClasses: Array.isArray(s.supportedSpeedClasses)
        ? s.supportedSpeedClasses
        : [],
    }));
    setLocalSlots(normalized);
    setOpen(true);
  }

  function addSlot() {
    setLocalSlots((prev): CardSlot[] => {
      if (prev.length >= 2) return prev;
      const next: CardSlot = {
        slotIndex: prev.length + 1,
        supportedFormFactors: [],
        supportedBuses: [],
        supportedSpeedClasses: [],
      };
      return [...prev, next].map((s, i) => ({ ...s, slotIndex: i + 1 }));
    });
  }

  function removeSlot(idx: number) {
    setLocalSlots((prev): CardSlot[] => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((s, i) => ({ ...s, slotIndex: i + 1 }));
    });
  }

  function updateSlot<K extends keyof CardSlot>(
    idx: number,
    key: K,
    value: CardSlot[K],
  ) {
    setLocalSlots((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value } as CardSlot;
      return next;
    });
  }

  function summarizedLines(slots: CardSlot[] | undefined): string[] {
    if (!Array.isArray(slots) || slots.length === 0) {
      return [tf("editGear.cardSlots.none", "None")];
    }
    return slots.slice(0, 2).map((s, idx) => {
      const details = formatCardSlotDetails(s);
      return tf("editGear.cardSlots.summary", "S{index}: {details}", {
        index: idx + 1,
        details: details || tf("editGear.cardSlots.empty", "(empty)"),
      });
    });
  }

  return (
    <div
      id="cardSlots"
      data-force-ring-container
      className="col-span-2 rounded-md border p-3"
    >
      <div className="mb-2 text-sm font-medium">
        {tf("editGear.sections.cardSlots", "Card Slots")}
      </div>
      <div className="space-y-1">
        {summarizedLines(value).map((line, i) => (
          <div key={i} className="text-sm">
            {line}
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Button type="button" size="sm" onClick={openDialog}>
          {tf("editGear.cardSlots.manage", "Manage Card Slots")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {tf("editGear.cardSlots.manage", "Manage Card Slots")}
            </DialogTitle>
            <DialogDescription>
              {tf(
                "editGear.cardSlots.description",
                "Define each slot with supported formats, buses, and speed classes.",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {localSlots.length === 0 && (
              <div className="text-muted-foreground text-sm">
                {tf("editGear.cardSlots.noneConfigured", "No slots configured.")}
              </div>
            )}

            {localSlots.map((slot, idx) => (
              <div key={idx} className="rounded-md border p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-medium">
                    {tf("editGear.slotLabel", "Slot {index}", { index: idx + 1 })}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSlot(idx)}
                  >
                    {tf("editGear.cardSlots.removeSlot", "Remove Slot")}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{tf("editGear.cardSlots.formFactors", "Form Factors")}</Label>
                    <MultiSelect
                      inDialog
                      options={formFactorOptions}
                      value={slot.supportedFormFactors}
                      onChange={(v) =>
                        updateSlot(idx, "supportedFormFactors", v)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{tf("editGear.cardSlots.buses", "Buses")}</Label>
                    <MultiSelect
                      inDialog
                      options={busOptions}
                      value={slot.supportedBuses}
                      onChange={(v) => updateSlot(idx, "supportedBuses", v)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      {tf("editGear.cardSlots.speedClasses", "Speed Classes (optional)")}
                    </Label>
                    <MultiSelect
                      inDialog
                      options={speedClassOptions}
                      value={slot.supportedSpeedClasses ?? []}
                      onChange={(v) =>
                        updateSlot(idx, "supportedSpeedClasses", v)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            {localSlots.length < 2 && (
              <div>
                <Button type="button" variant="outline" onClick={addSlot}>
                  {localSlots.length === 0
                    ? tf("editGear.cardSlots.addSlot", "Add Slot")
                    : tf("editGear.cardSlots.addSecondSlot", "Add Second Slot")}
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {tf("cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const normalized = localSlots.map((s, i) => ({
                  slotIndex: i + 1,
                  supportedFormFactors: Array.isArray(s.supportedFormFactors)
                    ? s.supportedFormFactors
                    : [],
                  supportedBuses: Array.isArray(s.supportedBuses)
                    ? s.supportedBuses
                    : [],
                  supportedSpeedClasses: Array.isArray(s.supportedSpeedClasses)
                    ? s.supportedSpeedClasses
                    : [],
                }));
                onChange(normalized);
                setOpen(false);
              }}
            >
              {tf("editGear.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
