"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  GearSearchCombobox,
  type GearOption,
} from "~/components/gear/gear-search-combobox";
import { useCompare } from "~/lib/hooks/useCompare";
import { buildCompareHref } from "~/lib/utils/url";
import { useCompareLoadingOverlay } from "~/components/compare/compare-loading-overlay";

export function CompareReplaceButton({
  slug,
  fallbackIndex,
}: {
  slug: string | null | undefined;
  fallbackIndex: 0 | 1;
}) {
  const router = useRouter();
  const { slots, replaceAt } = useCompare();
  const { show, hide } = useCompareLoadingOverlay();
  const [selection, setSelection] = useState<GearOption | null>(null);

  const slotIndex = useMemo(() => {
    const matchIndex = slots.findIndex((slot) => slot?.slug === slug);
    if (matchIndex === -1) return fallbackIndex;
    return (matchIndex === 0 ? 0 : 1) as 0 | 1;
  }, [slots, slug, fallbackIndex]);

  const currentSlot = slots[slotIndex] ?? null;

  const handleSelectionChange = useCallback(
    async (option: GearOption | null) => {
      if (!option) return;
      const success = await replaceAt(slotIndex, {
        slug: option.slug,
        name: option.name,
        thumbnailUrl: option.thumbnailUrl ?? undefined,
        gearType: option.gearType ?? undefined,
      });
      if (!success) {
        hide();
        return;
      }
      show();
      const nextSlugs = slots.map((slot) => slot?.slug ?? null);
      nextSlugs[slotIndex] = option.slug;
      const href = buildCompareHref(
        nextSlugs.filter((slug): slug is string => Boolean(slug)),
        { preserveOrder: true },
      );
      try {
        router.push(href);
      } catch {
        hide();
      }
      setSelection(null);
    },
    [replaceAt, slotIndex, slots, router, show, hide],
  );

  return (
    <GearSearchCombobox
      value={selection}
      setValue={setSelection}
      placeholder={
        currentSlot
          ? `Replace ${currentSlot.name ?? currentSlot.slug}`
          : "Search gear"
      }
      searchPlaceholder="Search gear to compare"
      allowClear={false}
      fullWidth={false}
      onSelectionChange={handleSelectionChange}
      renderTrigger={({ open }) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          data-state={open ? "open" : "closed"}
        >
          <Pencil className="mr-2 size-4" aria-hidden="true" />
          Replace
        </Button>
      )}
    />
  );
}

