"use client";

import NumberFlow,{ continuous } from "@number-flow/react";
import { useInView,useReducedMotion } from "motion/react";
import { useEffect,useRef,useState } from "react";

type AnimatedStatCounterValueProps = {
  value: number;
  className?: string;
  delayMs?: number;
  seed?: number;
  startRatio?: number;
  randomnessRatio?: number;
  transformDurationMs?: number;
  spinDurationMs?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getBaseStartValue(value: number, startRatio: number): number {
  return Math.floor(value * startRatio);
}

function getDeterministicOffset(seed: number): number {
  const normalizedSeed = seed >>> 0;
  const hashedSeed = Math.imul(normalizedSeed ^ 0x9e3779b9, 0x85ebca6b);

  return ((hashedSeed >>> 0) % 10_001) / 10_000;
}

function getRandomizedStartValue(
  value: number,
  seed: number,
  startRatio: number,
  randomnessRatio: number,
): number {
  if (value <= 1) {
    return 0;
  }

  const baseStart = getBaseStartValue(value, startRatio);
  const maxOffset = Math.max(1, Math.floor(value * randomnessRatio));
  const randomOffset =
    Math.floor(getDeterministicOffset(seed) * (maxOffset * 2 + 1)) - maxOffset;

  return clamp(baseStart + randomOffset, 0, value - 1);
}

export function AnimatedStatCounterValue({
  value,
  className,
  delayMs = 0,
  seed = 0,
  startRatio = 0.5,
  randomnessRatio = 0.08,
  transformDurationMs = 1_250,
  spinDurationMs = 1_000,
}: AnimatedStatCounterValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const startValue = getRandomizedStartValue(
    value,
    seed ^ value,
    startRatio,
    randomnessRatio,
  );
  const [displayedValue, setDisplayedValue] = useState<number>(() =>
    reduceMotion ? value : startValue,
  );

  useEffect(() => {
    if (reduceMotion) {
      setDisplayedValue(value);
      return;
    }

    if (!isInView) {
      setDisplayedValue(startValue);
      return;
    }

    let frameId: number | null = null;
    const timerId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => {
        setDisplayedValue(value);
      });
    }, delayMs);

    return () => {
      window.clearTimeout(timerId);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [delayMs, isInView, reduceMotion, startValue, value]);

  return (
    <span ref={ref} className="inline-block">
      <NumberFlow
        value={displayedValue}
        className={className}
        plugins={[continuous]}
        format={{ useGrouping: true }}
        transformTiming={{
          duration: transformDurationMs,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        spinTiming={{
          duration: spinDurationMs,
          easing:
            "linear(0, 0.0012 0.47%, 0.0061 1.09%, 0.0264, 0.0581 3.59%, 0.1043 4.99%, 0.212 7.65%, 0.4614 13.11%, 0.5758, 0.6782, 0.7662, 0.8393, 0.8979 26.37%, 0.9454 29.18%, 0.9642 30.58%, 0.9816 32.14%, 1.0027 34.64%, 1.0183 37.45%, 1.0278 40.57%, 1.0314 44%, 1.0291 49%, 1.0105 62.89%, 1.0028 71.78%, 0.9994 82.55%, 0.9993 99.87%)",
        }}
        opacityTiming={{ duration: 420, easing: "ease-out" }}
        willChange
      />
    </span>
  );
}
