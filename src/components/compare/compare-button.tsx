"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import { Button, type ButtonProps } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  GearSearchCombobox,
  type GearOption,
} from "~/components/gear/gear-search-combobox";
import { buildCompareHref } from "~/lib/utils/url";
import { actionRecordCompareAdd } from "~/server/popularity/actions";

export type CompareButtonProps = {
  slug: string;
  name: string;
  gearType?: string | null;
  size?: "sm" | "md";
  variant?: ButtonProps["variant"];
  className?: string;
  showLabel?: boolean;
};

export function CompareButton({
  slug,
  name,
  gearType,
  size = "sm",
  variant = "outline",
  className,
  showLabel = false,
}: CompareButtonProps) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<GearOption | null>(null);
  const router = useRouter();

  const handleSelect = async (option: GearOption | null) => {
    if (!option) return;
    setOpen(false);
    try {
      await actionRecordCompareAdd({ slug: option.slug });
    } catch {
      // ignore failures
    }
    router.push(buildCompareHref([slug, option.slug]));
  };

  return (
    <>
      <Button
        variant={variant}
        size={size === "sm" ? "sm" : "default"}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        icon={<Scale className="size-4" />}
      >
        {showLabel ? "Compare" : <span className="sr-only">Compare</span>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compare {name}</DialogTitle>
            <DialogDescription>
              Select another item to compare with {name}
            </DialogDescription>
          </DialogHeader>
          <GearSearchCombobox
            value={selection}
            setValue={setSelection}
            onSelectionChange={handleSelect}
            filters={gearType ? { gearType } : undefined}
            excludeIds={[slug]}
            placeholder="Search for gear..."
            searchPlaceholder="Search gear to compare"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
