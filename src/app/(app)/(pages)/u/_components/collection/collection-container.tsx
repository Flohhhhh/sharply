"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import type { GearItem } from "~/types/gear";
import { CollectionGrid } from "./collection-grid";

const designWidth = 1920;
const designHeight = 1080;

export function CollectionContainer(props: {
  items: GearItem[];
  className?: string;
}) {
  const { items, className } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;

      const fit = Math.min(w / designWidth, h / designHeight);
      setScale(Math.min(1, fit)); // clamp so it doesn't upscale in preview
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height: designHeight * scale }}
    >
      <div
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="bg-accent/50 relative mx-auto flex flex-col justify-center rounded p-12"
      >
        <CollectionGrid items={items} />
      </div>
    </div>
  );
}
