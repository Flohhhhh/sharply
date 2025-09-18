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
  gearType?: "CAMERA" | "LENS" | string;
};

type CompareContextValue = {
  items: CompareItem[];
  add: (item: CompareItem) => Promise<void>;
  remove: (slug: string) => void;
  clear: () => void;
  replaceAt: (index: number, item: CompareItem) => Promise<void>;
  contains: (slug: string) => boolean;
  isFull: boolean;
  href: string;
  acceptsType: (gearType: string | undefined) => boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

const STORAGE_KEY = "compare.items.v1";

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const { value, setValue, clear } = useLocalStorage<CompareItem[]>(
    STORAGE_KEY,
    [],
  );

  const items = value.slice(0, 2);

  async function recordCompareAdd(slug: string) {
    try {
      await actionRecordCompareAdd({ slug });
    } catch {
      // ignore failures
    }
  }

  const api: CompareContextValue = useMemo(() => {
    return {
      items,
      contains: (slug) => items.some((i) => i.slug === slug),
      isFull: items.length >= 2,
      href: buildCompareHref(items.map((i) => i.slug)),
      acceptsType: (gearType) => {
        if (!gearType) return true;
        if (items.length === 0) return true;
        const t = items[0]?.gearType;
        return !t || t === gearType;
      },
      clear,
      remove: (slug) => {
        const next = items.filter((i) => i.slug !== slug);
        setValue(next);
        toast.success("Removed from compare");
      },
      replaceAt: async (index, item) => {
        if (index < 0 || index > 1) return;
        // Block cross-type replacement
        if (items.length > 0) {
          const t = items[0]?.gearType;
          if (t && item.gearType && t !== item.gearType) {
            toast.warning("Types must match to compare");
            return;
          }
        }
        const next = items.slice();
        next[index] = item;
        setValue(next);
        toast.success("Replaced in compare");
        await recordCompareAdd(item.slug);
      },
      add: async (item) => {
        if (items.some((i) => i.slug === item.slug)) return;
        // Enforce same-type pairs
        if (items.length > 0) {
          const t = items[0]?.gearType;
          if (t && item.gearType && t !== item.gearType) {
            toast.warning("You can only compare items of the same type");
            return;
          }
        }
        if (items.length < 2) {
          setValue([...items, item]);
          toast.success(
            items.length === 0
              ? "Added to compare. Pick one more."
              : "Added to compare",
          );
          await recordCompareAdd(item.slug);
        } else {
          toast.warning(
            "You can only compare 2 items. Replace one to continue.",
          );
        }
      },
    };
  }, [items, setValue, clear]);

  return (
    <CompareContext.Provider value={api}>{children}</CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
