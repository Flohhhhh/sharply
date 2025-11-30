"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { Scale } from "lucide-react";
import { useCompare, type CompareItem } from "~/lib/hooks/useCompare";
import {
  GearSearchCombobox,
  type GearOption,
} from "~/components/gear/gear-search-combobox";
import { Button } from "~/components/ui/button";

export function CompareEmptyState() {
  const { slots, replaceAt, remove, clear, href, isFull } = useCompare();
  const selectionCount = slots.filter(Boolean).length;

  const slotOptions = useMemo(
    () => slots.map((slot) => slotToOption(slot)),
    [slots],
  );

  const handleSelectionChange = useCallback(
    (index: number, option: GearOption | null) => {
      const current = slots[index];
      if (!option) {
        if (current) {
          remove(current.slug);
        }
        return;
      }

      if (current?.slug === option.slug) {
        return;
      }

      void replaceAt(index, {
        slug: option.slug,
        name: option.name,
        thumbnailUrl: option.thumbnailUrl ?? undefined,
        gearType: option.gearType ?? undefined,
      });
    },
    [remove, replaceAt, slots],
  );

  const handleClear = useCallback(() => {
    clear();
  }, [clear]);

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
        {[0, 1].map((index) => {
          const columnValue = slotOptions[index] ?? null;
          return (
            <CompareEmptyColumn
              key={index}
              index={index}
              value={columnValue}
              onChange={(option) => handleSelectionChange(index, option)}
              hasSelection={Boolean(columnValue)}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href={href}>
          <Button size="lg" disabled={!isFull}>
            Compare selected gear
          </Button>
        </Link>
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
}: {
  index: number;
  value: GearOption | null;
  onChange: (value: GearOption | null) => void;
  hasSelection: boolean;
}) {
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

  const title = hasSelection
    ? (value?.name ?? "Selected item")
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
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        {hasSelection ? (
          hasImage ? (
            <div className="bg-muted relative h-36 w-full max-w-[220px] overflow-hidden rounded-2xl">
              <Image
                src={value?.thumbnailUrl ?? "/image-temp.png"}
                alt={value?.name ?? "Selected gear"}
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

function slotToOption(slot: CompareItem | null): GearOption | null {
  if (!slot) return null;
  return {
    id: slot.slug,
    slug: slot.slug,
    name: slot.name ?? slot.slug,
    gearType: slot.gearType ?? undefined,
    thumbnailUrl: slot.thumbnailUrl ?? undefined,
  };
}
