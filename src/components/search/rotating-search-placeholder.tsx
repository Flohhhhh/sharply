"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

type RotatingSearchPlaceholderProps = {
  examples: string[];
  className?: string;
};

const ROTATION_MS = 2600;

export function RotatingSearchPlaceholder({
  examples,
  className,
}: RotatingSearchPlaceholderProps) {
  const reduceMotion = useReducedMotion();
  const items = useMemo(
    () => examples.map((example) => example.trim()).filter(Boolean),
    [examples],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || items.length <= 1) return;

    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, ROTATION_MS);

    return () => window.clearInterval(interval);
  }, [items.length, reduceMotion]);

  const currentExample = items[index] ?? "";

  if (!currentExample) return null;

  return (
    <span className={className}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={currentExample}
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
          className="block truncate"
        >
          {currentExample}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
