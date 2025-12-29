"use client";

import NumberFlow from "@number-flow/react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "~/lib/utils";

type ScrollProgressProps = {
  bottomOffset?: number;
};

const ScrollProgress = ({ bottomOffset = 0 }: ScrollProgressProps) => {
  const { scrollYProgress } = useScroll();
  const [progressPercent, setProgressPercent] = useState(0);
  const [offsetFraction, setOffsetFraction] = useState(0);

  useEffect(() => {
    const updateOffsetFraction = () => {
      if (typeof window === "undefined") {
        return;
      }

      const scrollableSpace =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollableSpace <= 0) {
        setOffsetFraction(0);
        return;
      }

      const clampedOffset = Math.min(
        Math.max(bottomOffset, 0),
        scrollableSpace,
      );

      setOffsetFraction(clampedOffset / scrollableSpace);
    };

    updateOffsetFraction();
    window.addEventListener("resize", updateOffsetFraction);

    return () => {
      window.removeEventListener("resize", updateOffsetFraction);
    };
  }, [bottomOffset]);

  const clampedProgress = useTransform(scrollYProgress, (value) =>
    Math.min(Math.max(value, 0), 1),
  );
  const adjustedProgress = useTransform(clampedProgress, (value) => {
    const divisor = 1 - offsetFraction;

    if (divisor <= 0) {
      return 1;
    }

    return Math.min(value / divisor, 1);
  });

  const progressAsPercent = useTransform(adjustedProgress, (value) =>
    Math.round(value * 100),
  );

  useMotionValueEvent(progressAsPercent, "change", setProgressPercent);

  const svgRadius = 18;
  const circumference = 2 * Math.PI * svgRadius;

  return (
    <motion.div
      drag
      dragMomentum={false}
      className={cn(
        "group fixed right-4 bottom-4 cursor-grab items-center gap-1 opacity-0 active:cursor-grabbing sm:opacity-100",
      )}
    >
      <NumberFlow
        value={progressPercent}
        className={cn(
          "text-foreground/20 absolute top-1 flex h-8 -translate-y-full items-center justify-center px-4 text-xs font-medium tabular-nums opacity-0 group-hover:opacity-100",
        )}
        suffix="%"
      />
      <div className="bg-background/30 flex size-12 items-center justify-center rounded-2xl border backdrop-blur">
        <svg className={cn("size-10")} viewBox="0 0 48 48" role="presentation">
          <circle
            cx="24"
            cy="24"
            r={svgRadius}
            stroke="currentColor"
            strokeWidth="3"
            className={cn("opacity-30")}
            fill="none"
          />
          <motion.circle
            cx="24"
            cy="24"
            r={svgRadius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            style={{
              pathLength: adjustedProgress,
              rotate: -90,
              transformOrigin: "50% 50%",
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
};

export { ScrollProgress };
