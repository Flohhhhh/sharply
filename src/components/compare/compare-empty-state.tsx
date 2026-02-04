"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import {
  GearSearchCombobox,
  type GearOption,
} from "~/components/gear/gear-search-combobox";
import { Button } from "~/components/ui/button";
import { useCompareLoadingOverlay } from "~/components/compare/compare-loading-overlay";
import { buildCompareHref } from "~/lib/utils/url";
import { actionRecordCompareAdd } from "~/server/popularity/actions";
import { GetGearDisplayName } from "~/lib/gear/naming";
import { useCountry } from "~/lib/hooks/useCountry";

export function CompareEmptyState() {
  const router = useRouter();
  const [slot0, setSlot0] = useState<GearOption | null>(null);
  const [slot1, setSlot1] = useState<GearOption | null>(null);
  const { show } = useCompareLoadingOverlay();

  const selectionCount = [slot0, slot1].filter(Boolean).length;
  const isFull = slot0 !== null && slot1 !== null;

  const handleSelectionChange = useCallback(
    (index: number, option: GearOption | null) => {
      if (index === 0) {
        setSlot0(option);
        // Clear slot1 if type doesn't match
        if (option && slot1 && option.gearType !== slot1.gearType) {
          setSlot1(null);
        }
      } else {
        setSlot1(option);
      }
    },
    [slot1],
  );

  const handleClear = useCallback(() => {
    setSlot0(null);
    setSlot1(null);
  }, []);

  const handleCompare = useCallback(async () => {
    if (!slot0 || !slot1) return;
    show();

    // Record compare adds
    try {
      await Promise.all([
        actionRecordCompareAdd({ slug: slot0.slug }),
        actionRecordCompareAdd({ slug: slot1.slug }),
      ]);
    } catch {
      // ignore failures
    }

    const href = buildCompareHref([slot0.slug, slot1.slug]);
    router.push(href);
  }, [slot0, slot1, router, show]);

  return (
    <div className="mx-auto mt-24 min-h-screen max-w-5xl space-y-10 px-4 py-16">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold md:text-4xl">
          Nothing to compare yet
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-sm md:text-base">
          Use the selectors below to search the catalog and lock in two matching
          items, or open the global search to explore gear first.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CompareEmptyColumn
          index={0}
          value={slot0}
          onChange={(option) => handleSelectionChange(0, option)}
          hasSelection={Boolean(slot0)}
          gearTypeFilter={undefined}
          excludeIds={slot1 ? [slot1.slug] : []}
        />
        <CompareEmptyColumn
          index={1}
          value={slot1}
          onChange={(option) => handleSelectionChange(1, option)}
          hasSelection={Boolean(slot1)}
          gearTypeFilter={slot0?.gearType ?? undefined}
          excludeIds={slot0 ? [slot0.slug] : []}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" disabled={!isFull} onClick={handleCompare}>
          Compare selected gear
        </Button>
        {selectionCount > 0 ? (
          <Button variant="ghost" onClick={handleClear}>
            Clear slots
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CompareEmptyColumn({
  index,
  value,
  onChange,
  hasSelection,
  gearTypeFilter,
  excludeIds,
}: {
  index: number;
  value: GearOption | null;
  onChange: (value: GearOption | null) => void;
  hasSelection: boolean;
  gearTypeFilter?: string | null;
  excludeIds: string[];
}) {
  const { region } = useCountry();
  const placeholders = [
    {
      title: "Pick the first item",
      body: "Search for any camera, lens, or accessory to start a comparison.",
    },
    {
      title: "Pick the second item",
      body: "Match it with another item of the same type to unlock the table.",
    },
  ];

  const displayName = value
    ? GetGearDisplayName(
        { name: value.name, regionalAliases: value.regionalAliases ?? [] },
        { region },
      )
    : null;

  const title = hasSelection
    ? (displayName ?? "Selected item")
    : placeholders[index]?.title;
  const body = hasSelection
    ? "Use the selector above to swap or clear this slot."
    : placeholders[index]?.body;

  const hasImage = Boolean(value?.thumbnailUrl);

  return (
    <div className="bg-card/30 rounded-2xl border border-dashed shadow-sm">
      <div className="border-border border-b px-4 py-4 md:px-6">
        <GearSearchCombobox
          value={value}
          setValue={onChange}
          placeholder={
            index === 0 ? "Select first gear item" : "Select second gear item"
          }
          buttonClassName="text-base font-medium"
          filters={gearTypeFilter ? { gearType: gearTypeFilter } : undefined}
          excludeIds={excludeIds}
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        {hasSelection ? (
          hasImage ? (
            <div className="bg-muted relative h-36 w-full max-w-[220px] overflow-hidden rounded-2xl">
              <Image
                src={value?.thumbnailUrl ?? "/image-temp.png"}
                alt={displayName ?? "Selected gear"}
                fill
                sizes="220px"
                className="object-contain object-center"
                priority={false}
              />
            </div>
          ) : (
            <div className="text-muted-foreground flex h-32 w-full max-w-[220px] items-center justify-center rounded-2xl border border-dashed text-xs tracking-wide uppercase">
              Image coming soon
            </div>
          )
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed">
            <Scale className="text-muted-foreground size-5" />
          </div>
        )}
        <div className="space-y-1">
          <p className="text-lg font-medium">{title}</p>
          <p className="text-muted-foreground text-sm">{body}</p>
        </div>
      </div>
    </div>
  );
}
