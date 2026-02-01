"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  GearSearchCombobox,
  type GearOption,
} from "~/components/gear/gear-search-combobox";
import { buildCompareHref } from "~/lib/utils/url";
import { useCompareLoadingOverlay } from "~/components/compare/compare-loading-overlay";
import { actionRecordCompareAdd } from "~/server/popularity/actions";

export type CompareReplaceButtonProps = {
  currentSlug: string | null | undefined;
  otherSlug: string | null | undefined;
  currentGearType?: string | null;
  currentName?: string | null;
};

export function CompareReplaceButton({
  currentSlug,
  otherSlug,
  currentGearType,
  currentName,
}: CompareReplaceButtonProps) {
  const router = useRouter();
  const { show, hide } = useCompareLoadingOverlay();
  const [selection, setSelection] = useState<GearOption | null>(null);

  const handleSelectionChange = useCallback(
    async (option: GearOption | null) => {
      if (!option) return;

      // Check type compatibility
      if (
        currentGearType &&
        option.gearType &&
        currentGearType !== option.gearType
      ) {
        toast.warning("Types must match to compare");
        return;
      }

      show();

      try {
        await actionRecordCompareAdd({ slug: option.slug });
      } catch {
        // ignore failures
      }

      // Build new URL with the replacement
      const newSlugs: string[] = [];
      if (otherSlug) {
        newSlugs.push(otherSlug);
      }
      newSlugs.push(option.slug);

      const href = buildCompareHref(newSlugs, { preserveOrder: true });

      try {
        router.push(href);
      } catch {
        hide();
      }
      setSelection(null);
    },
    [currentGearType, otherSlug, router, show, hide],
  );

  const placeholderText = currentName
    ? `Replace ${currentName}`
    : currentSlug
      ? `Replace ${currentSlug}`
      : "Search gear";

  return (
    <GearSearchCombobox
      value={selection}
      setValue={setSelection}
      placeholder={placeholderText}
      searchPlaceholder="Search gear to compare"
      allowClear={false}
      fullWidth={false}
      filters={currentGearType ? { gearType: currentGearType } : undefined}
      excludeIds={[currentSlug, otherSlug].filter(
        (slug): slug is string => Boolean(slug),
      )}
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
