"use client";

import { Button } from "~/components/ui/button";
import { Plus, Check, Scale } from "lucide-react";
import { useCompare } from "~/lib/hooks/useCompare";

export function AddToCompareButton({
  slug,
  name,
  gearType,
  size = "sm",
  className,
  stopPropagation = true,
  iconStyle = "auto",
  showLabel = false,
}: {
  slug: string;
  name?: string;
  gearType?: string;
  size?: "sm" | "md";
  className?: string;
  /** When rendered inside a link, prevent navigation */
  stopPropagation?: boolean;
  /** Force a specific icon style (e.g., search suggestions need Scale+Plus) */
  iconStyle?: "auto" | "scalePlus";
  /** Whether to show a visible text label next to the icon */
  showLabel?: boolean;
}) {
  const { add, contains, isFull, acceptsType } = useCompare();
  const active = contains(slug);
  const wrongType = !acceptsType(gearType);
  const disabled = active || isFull || wrongType;

  return (
    <Button
      variant={active ? "secondary" : "secondary"}
      size={size === "sm" ? "sm" : "default"}
      className={className}
      disabled={disabled}
      icon={
        active ? (
          <Check className="h-4 w-4" />
        ) : iconStyle === "scalePlus" ? (
          <span className="inline-flex items-center gap-1">
            <Scale className="h-4 w-4" />
            <Plus className="h-3.5 w-3.5" />
          </span>
        ) : (
          <Plus className="h-4 w-4" />
        )
      }
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        void add({ slug, name, gearType: gearType as any });
      }}
    >
      {showLabel ? (
        wrongType ? (
          "Type mismatch"
        ) : active ? (
          "Added"
        ) : (
          "Add to compare"
        )
      ) : (
        <span className="sr-only">
          {wrongType ? "Type mismatch" : active ? "Added" : "Add to compare"}
        </span>
      )}
    </Button>
  );
}
