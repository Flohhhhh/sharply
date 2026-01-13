"use client";

import { ArrowBigDown, ArrowDown, MouseIcon } from "lucide-react";
import { Children, useEffect, useMemo, useRef } from "react";

import { ScrollArea } from "~/components/ui/scroll-area";

// Tune how quickly a wheel notch advances items. Lower is "easier" to scroll multiple items quickly.
const WHEEL_STEP_DELAY_MS = 0;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type ScrollBoxProps = {
  children: React.ReactNode;
  activeIndex: number;
  onActiveIndexChange?: (index: number) => void;
};

export function ScrollBox({
  children,
  activeIndex,
  onActiveIndexChange,
}: ScrollBoxProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const suppressNextAutoScroll = useRef(false);
  const scrollEndTimeoutRef = useRef<number | null>(null);
  const lastClosestRef = useRef(activeIndex);
  const lastWheelAtRef = useRef<number>(0);
  const externalChangeTimeoutRef = useRef<number | null>(null);
  const itemRefs = useMemo(
    () =>
      Children.toArray(children).map(() => ({
        current: null as HTMLElement | null,
      })),
    [children],
  );

  const scrollToIndex = (
    index: number,
    behavior: ScrollBehavior = "smooth",
  ) => {
    const viewport = viewportRef.current;
    const target = itemRefs[index]?.current;
    if (!viewport || !target) return;

    const itemRect = target.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const offset =
      target.offsetTop - (viewportRect.height - itemRect.height) / 2;
    viewport.scrollTo({ top: Math.max(offset, 0), behavior });
  };

  useEffect(() => {
    lastClosestRef.current = activeIndex;
    suppressNextAutoScroll.current = true;
    if (externalChangeTimeoutRef.current !== null) {
      window.clearTimeout(externalChangeTimeoutRef.current);
    }
    externalChangeTimeoutRef.current = window.setTimeout(() => {
      suppressNextAutoScroll.current = false;
      externalChangeTimeoutRef.current = null;
    }, 200);
    scrollToIndex(activeIndex, "smooth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !onActiveIndexChange) return;

    const findClosestToCenter = () => {
      const center = viewport.scrollTop + viewport.clientHeight / 2;
      let closestIndex = activeIndex;
      let closestDistance = Number.POSITIVE_INFINITY;

      itemRefs.forEach((ref, index) => {
        const node = ref.current;
        if (!node) return;
        const itemCenter = node.offsetTop + node.clientHeight / 2;
        const distance = Math.abs(itemCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      lastClosestRef.current = closestIndex;
    };

    const onScroll = () => {
      if (suppressNextAutoScroll.current) return;
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        findClosestToCenter();
      });

      if (scrollEndTimeoutRef.current !== null) {
        window.clearTimeout(scrollEndTimeoutRef.current);
      }
      scrollEndTimeoutRef.current = window.setTimeout(() => {
        scrollEndTimeoutRef.current = null;
        if (onActiveIndexChange) {
          suppressNextAutoScroll.current = true;
          onActiveIndexChange(lastClosestRef.current);
        }
        scrollToIndex(lastClosestRef.current, "smooth");
      }, 120);
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    const onWheel = (event: WheelEvent) => {
      const shouldThrottle = WHEEL_STEP_DELAY_MS > 0;
      if (shouldThrottle) {
        const now = Date.now();
        if (now - lastWheelAtRef.current < WHEEL_STEP_DELAY_MS) return;
        lastWheelAtRef.current = now;
      }

      const direction = Math.sign(event.deltaY);
      if (direction === 0) return;

      const nextIndex = clamp(
        lastClosestRef.current + direction,
        0,
        itemRefs.length - 1,
      );
      if (nextIndex === lastClosestRef.current) return;

      event.preventDefault();
      suppressNextAutoScroll.current = true;
      lastClosestRef.current = nextIndex;
      onActiveIndexChange?.(nextIndex);
      scrollToIndex(nextIndex, "smooth");
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      viewport.removeEventListener("scroll", onScroll);
      viewport.removeEventListener("wheel", onWheel);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (scrollEndTimeoutRef.current !== null) {
        window.clearTimeout(scrollEndTimeoutRef.current);
        scrollEndTimeoutRef.current = null;
      }
    };
  }, [activeIndex, itemRefs, onActiveIndexChange]);

  return (
    <ScrollArea
      className="h-full min-h-0 w-full overflow-hidden"
      viewportClassName="scroll-pt-12 scroll-pb-12"
      viewportRef={viewportRef}
    >
      <div className="text-muted-foreground flex flex-col gap-6 p-4">
        <div className="flex aspect-3/2 flex-col items-center justify-end">
          {/* <h3>Scroll or use options above to select a focal length</h3> */}
          <div className="flex items-center">
            <MouseIcon className="size-8" />
            <ArrowDown className="size-6" />
          </div>
        </div>
        {Children.map(children, (child, index) => (
          <div
            ref={(node) => {
              itemRefs[index]!.current = node;
            }}
            onClick={() => {
              lastClosestRef.current = index;
              onActiveIndexChange?.(index);
              scrollToIndex(index);
            }}
            className="cursor-pointer"
          >
            {child}
          </div>
        ))}
        <div className="aspect-3/2"></div>
      </div>
    </ScrollArea>
  );
}
