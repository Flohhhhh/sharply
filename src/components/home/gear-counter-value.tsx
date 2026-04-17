"use client";

import { AnimatedStatCounterValue } from "./animated-stat-counter-value";

type GearCounterValueProps = {
  value: number;
  className?: string;
};

export function GearCounterValue({ value, className }: GearCounterValueProps) {
  return (
    <AnimatedStatCounterValue
      value={value}
      className={className}
      delayMs={0}
      seed={83}
      startRatio={0.34}
      randomnessRatio={0.12}
      transformDurationMs={1_250}
      spinDurationMs={2_250}
    />
  );
}
