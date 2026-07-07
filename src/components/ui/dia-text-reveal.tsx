"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "~/lib/utils";

const DEFAULT_COLORS = [
  "#c679c4",
  "#fa3d1d",
  "#ffb005",
  "#e1e1fe",
  "#0358f7",
];
const BAND_HALF = 17;
const SWEEP_START = -BAND_HALF;
const SWEEP_END = 100 + BAND_HALF;

const sweepEase = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

function buildGradient(pos: number, colors: string[], textColor: string) {
  const bandStart = pos - BAND_HALF;
  const bandEnd = pos + BAND_HALF;

  if (bandStart >= 100) {
    return `linear-gradient(90deg, ${textColor}, ${textColor})`;
  }

  const parts: string[] = [];
  const colorCount = colors.length;

  if (bandStart > 0) {
    parts.push(`${textColor} 0%`, `${textColor} ${bandStart.toFixed(2)}%`);
  }

  colors.forEach((color, index) => {
    const pct =
      colorCount === 1
        ? pos
        : bandStart + (index / (colorCount - 1)) * BAND_HALF * 2;
    parts.push(`${color} ${pct.toFixed(2)}%`);
  });

  if (bandEnd < 100) {
    parts.push(`transparent ${bandEnd.toFixed(2)}%`, "transparent 100%");
  }

  return `linear-gradient(90deg, ${parts.join(", ")})`;
}

function measureWidths(element: HTMLElement, texts: string[]) {
  const ghost = element.cloneNode() as HTMLElement;
  Object.assign(ghost.style, {
    position: "absolute",
    visibility: "hidden",
    pointerEvents: "none",
    width: "auto",
    whiteSpace: "nowrap",
  });
  element.parentElement?.appendChild(ghost);
  const widths = texts.map((text) => {
    ghost.textContent = text;
    return ghost.getBoundingClientRect().width;
  });
  ghost.remove();
  return widths;
}

export interface DiaTextRevealProps
  extends Omit<
    HTMLMotionProps<"span">,
    "ref" | "children" | "style" | "animate" | "transition" | "color"
  > {
  text: string | string[];
  colors?: string[];
  textColor?: string;
  duration?: number;
  delay?: number;
  repeat?: boolean;
  repeatDelay?: number;
  exitAnimation?: "fade" | "reverse" | "none";
  exitDuration?: number;
  startOnView?: boolean;
  once?: boolean;
  className?: string;
  fixedWidth?: boolean;
  animateWidth?: boolean;
}

export function DiaTextReveal({
  text,
  colors = DEFAULT_COLORS,
  textColor = "var(--foreground)",
  duration = 1.5,
  delay = 0,
  repeat = false,
  repeatDelay = 0.5,
  exitAnimation,
  exitDuration = 0.3,
  startOnView = true,
  once = true,
  className,
  fixedWidth = false,
  animateWidth = true,
  ...props
}: DiaTextRevealProps) {
  const texts = Array.isArray(text) ? text : [text];
  const isMulti = texts.length > 1;
  const prefersReducedMotion = useReducedMotion();

  const spanRef = useRef<HTMLSpanElement>(null);
  const optionsRef = useRef({
    colors,
    textColor,
    duration,
    delay,
    repeat,
    repeatDelay,
    exitAnimation: exitAnimation ?? (repeat ? "fade" : "none"),
    exitDuration,
    texts,
  });
  optionsRef.current = {
    colors,
    textColor,
    duration,
    delay,
    repeat,
    repeatDelay,
    exitAnimation: exitAnimation ?? (repeat ? "fade" : "none"),
    exitDuration,
    texts,
  };

  const indexRef = useRef(0);
  const hasPlayedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const playRef = useRef<() => void>(null!);
  const stopRef = useRef<(() => void) | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [measuredWidths, setMeasuredWidths] = useState<number[]>([]);

  const sweepPos = useMotionValue(SWEEP_START);
  const opacity = useMotionValue(1);
  const backgroundImage = useTransform(sweepPos, (pos) =>
    buildGradient(pos, optionsRef.current.colors, optionsRef.current.textColor),
  );
  const isInView = useInView(spanRef, { once, amount: 0.1 });

  useEffect(() => {
    const element = spanRef.current;
    if (!element || !isMulti || !animateWidth) return;
    setMeasuredWidths(measureWidths(element, texts));
  }, [animateWidth, isMulti, text, texts]);

  playRef.current = () => {
    const { duration, delay, repeat, repeatDelay, texts } = optionsRef.current;

    sweepPos.set(SWEEP_START);

    const controls = animate(sweepPos, SWEEP_END, {
      duration,
      delay,
      ease: sweepEase,
      onComplete() {
        if (!repeat) return;
        timerRef.current = setTimeout(() => {
          void (async () => {
            const { exitAnimation, exitDuration } = optionsRef.current;

            if (exitAnimation === "fade") {
              await animate(opacity, 0, { duration: exitDuration });
            } else if (exitAnimation === "reverse") {
              await animate(sweepPos, SWEEP_START, {
                duration: exitDuration,
                ease: sweepEase,
              });
            }

            const nextIndex = (indexRef.current + 1) % texts.length;
            indexRef.current = nextIndex;
            setActiveIndex(nextIndex);

            if (exitAnimation === "fade") {
              sweepPos.set(SWEEP_START);
              opacity.set(1);
            }

            playRef.current();
          })();
        }, repeatDelay * 1000);
      },
    });

    stopRef.current = () => controls.stop();
  };

  useEffect(() => {
    if (prefersReducedMotion) {
      sweepPos.set(SWEEP_END);
      opacity.set(1);
      return;
    }
    if (startOnView && !isInView) return;
    if (once && hasPlayedRef.current) return;

    hasPlayedRef.current = true;
    playRef.current();

    return () => {
      stopRef.current?.();
      clearTimeout(timerRef.current);
    };
  }, [isInView, once, prefersReducedMotion, startOnView, sweepPos, opacity]);

  const fixedWidthValue =
    isMulti && fixedWidth && animateWidth && measuredWidths.length > 0
      ? Math.max(...measuredWidths)
      : undefined;

  const animatedWidth =
    isMulti && animateWidth && !fixedWidth && measuredWidths[activeIndex] != null
      ? measuredWidths[activeIndex]
      : undefined;

  const usesNaturalInlineWidth = isMulti && !fixedWidth && !animateWidth;

  return (
    <motion.span
      ref={spanRef}
      className={cn(
        isMulti
          ? "inline-block align-baseline text-inherit leading-[inherit]"
          : "align-bottom leading-[100%] text-inherit",
        usesNaturalInlineWidth && "w-auto max-w-none",
        className,
      )}
      style={{
        ...(!isMulti ? { transform: "translateY(-2px)" } : {}),
        opacity,
        color: "transparent",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        backgroundSize: "100% 100%",
        backgroundImage,
        ...(isMulti && {
          display: "inline-block",
          verticalAlign: "baseline",
          paddingInlineEnd: "0.12em",
          marginInlineEnd: usesNaturalInlineWidth ? "-0.12em" : undefined,
          ...(usesNaturalInlineWidth
            ? { width: "auto" }
            : {
                overflow: "hidden",
                whiteSpace: "nowrap",
                ...(fixedWidthValue != null && { width: fixedWidthValue }),
              }),
        }),
      }}
      animate={animatedWidth != null ? { width: animatedWidth } : undefined}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      {...props}
    >
      {texts[activeIndex]}
    </motion.span>
  );
}
