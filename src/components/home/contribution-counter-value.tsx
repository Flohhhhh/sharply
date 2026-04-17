"use client";

import { AnimatedStatCounterValue } from "./animated-stat-counter-value";

type ContributionCounterValueProps = {
  value: number;
  className?: string;
};

export function ContributionCounterValue({
  value,
  className,
}: ContributionCounterValueProps) {
  return (
    <AnimatedStatCounterValue
      value={value}
      className={className}
      delayMs={0}
      seed={17}
      startRatio={0.58}
      randomnessRatio={0.05}
      transformDurationMs={1_250}
      spinDurationMs={1_800}
    />
  );
}
