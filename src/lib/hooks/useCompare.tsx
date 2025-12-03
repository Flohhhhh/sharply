"use client";

import { createContext, useContext, useMemo } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "~/lib/hooks/useLocalStorage";
import { actionRecordCompareAdd } from "~/server/popularity/actions";
import { buildCompareHref } from "~/lib/utils/url";

export type CompareItem = {
  slug: string;
  name?: string;
  thumbnailUrl?: string;
  gearType?: string;
};

type CompareSlot = CompareItem | null;
type CompareSlots = [CompareSlot, CompareSlot];

type CompareContextValue = {
  items: CompareItem[];
  slots: CompareSlots;
  add: (item: CompareItem) => Promise<void>;
  remove: (slug: string) => void;
  clear: () => void;
  replaceAt: (index: number, item: CompareItem) => Promise<boolean>;
  contains: (slug: string) => boolean;
  isFull: boolean;
  href: string;
  acceptsType: (gearType: string | undefined) => boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

const STORAGE_KEY = "compare.items.v1";

function ensureSlots(value: CompareSlot[] | undefined): CompareSlots {
  const next = Array.isArray(value) ? value.slice(0, 2) : [];
  while (next.length < 2) {
    next.push(null);
  }
  return next as CompareSlots;
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const { value, setValue, clear: clearStorage } = useLocalStorage<CompareSlot[]>(
    STORAGE_KEY,
    [null, null],
  );

  const slots = useMemo(() => ensureSlots(value), [value]);
  const items = useMemo(
    () => slots.filter((slot): slot is CompareItem => Boolean(slot)),
    [slots],
  );

  async function recordCompareAdd(slug: string) {
    try {
      await actionRecordCompareAdd({ slug });
    } catch {
      // ignore failures
    }
  }

  const api: CompareContextValue = useMemo(() => {
    function commit(next: CompareSlots) {
      setValue(next);
    }

    const firstSlotWithType = slots.find(
      (slot) => slot?.gearType,
    ) as CompareItem | undefined;

    return {
      items,
      slots,
      contains: (slug) => items.some((i) => i.slug === slug),
      isFull: slots.every((slot) => Boolean(slot)),
      href: buildCompareHref(
        slots
          .map((slot) => slot?.slug ?? null)
          .filter((slug): slug is string => Boolean(slug)),
        { preserveOrder: true },
      ),
      acceptsType: (gearType) => {
        if (!gearType) return true;
        const anchor = firstSlotWithType?.gearType;
        if (!anchor) return true;
        return anchor === gearType;
      },
      clear: () => {
        clearStorage();
      },
      remove: (slug) => {
        let removed = false;
        const next = slots.map((slot) => {
          if (slot?.slug === slug) {
            removed = true;
            return null;
          }
          return slot;
        }) as CompareSlots;
        if (!removed) return;
        commit(next);
        toast.success("Removed from compare");
      },
      replaceAt: async (index, item) => {
        if (index < 0 || index > 1) return false;
        const otherSlot = slots[index === 0 ? 1 : 0];
        if (
          otherSlot?.gearType &&
          item.gearType &&
          otherSlot.gearType !== item.gearType
        ) {
            toast.warning("Types must match to compare");
          return false;
        }
        const current = slots[index];
        if (current?.slug === item.slug) return false;
        const next = [...slots] as CompareSlots;
        next[index] = item;
        commit(next);
        toast.success(current ? "Replaced in compare" : "Added to compare");
        await recordCompareAdd(item.slug);
        return true;
      },
      add: async (item) => {
        if (slots.some((slot) => slot?.slug === item.slug)) return;
        if (
          firstSlotWithType?.gearType &&
          item.gearType &&
          firstSlotWithType.gearType !== item.gearType
        ) {
            toast.warning("You can only compare items of the same type");
            return;
          }
        const emptyIndex = slots.findIndex((slot) => slot === null);
        if (emptyIndex === -1) {
          toast.warning(
            "You can only compare 2 items. Replace one to continue.",
          );
          return;
        }
        const next = [...slots] as CompareSlots;
        next[emptyIndex] = item;
        commit(next);
        const filledCount = next.filter(Boolean).length;
        toast.success(
          filledCount === 1 ? "Added to compare. Pick one more." : "Added to compare",
        );
        await recordCompareAdd(item.slug);
      },
    };
  }, [items, slots, setValue, clearStorage]);

  return (
    <CompareContext.Provider value={api}>{children}</CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
