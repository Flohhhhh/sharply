"use client";

import { useMemo, useRef } from "react";

type ScaleItem = {
  widthMillimeters?: number | null;
};

export type CompareRowScale = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pixelsPerMillimeter: number;
};

/**
 * Returns a stable pixels-per-millimeter value.
 */
export function useCompareRowScale({
  items,
  basePixelsPerMillimeter = 3.0,
}: {
  items: ScaleItem[];
  basePixelsPerMillimeter?: number;
}): CompareRowScale {
  const containerRef = useRef<HTMLDivElement>(null);

  const pixelsPerMillimeter = useMemo(() => {
    const validWidths = items
      .map((item) =>
        typeof item.widthMillimeters === "number"
          ? item.widthMillimeters
          : null,
      )
      .filter(
        (value): value is number => value !== null && !Number.isNaN(value),
      );

    if (validWidths.length === 0) {
      return basePixelsPerMillimeter;
    }

    return basePixelsPerMillimeter;
  }, [items, basePixelsPerMillimeter]);

  return {
    containerRef,
    pixelsPerMillimeter,
  };
}
