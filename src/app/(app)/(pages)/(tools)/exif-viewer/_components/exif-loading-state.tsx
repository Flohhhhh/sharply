"use client";

import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

type ExifLoadingStateProps = {
  stageLabel: string;
  isReducedMotion?: boolean;
  className?: string;
};

const SKELETON_IDS = ["count-1", "count-2", "count-3", "count-4"] as const;

export default function ExifLoadingState({
  stageLabel,
  isReducedMotion = false,
  className,
}: ExifLoadingStateProps) {
  return (
    <motion.div
      className={cn(
        " flex min-h-72 items-center justify-center rounded-xl px-6 py-12 text-center",
        className,
      )}
      initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.985 }}
      animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.992 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-6">
        <div className="flex items-end justify-center gap-4">
          {SKELETON_IDS.map((id, index) => (
            <motion.div
              key={id}
              className="relative h-24 w-14 overflow-hidden rounded-xl bg-muted/20"
              initial={
                isReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 14, scale: 0.96 }
              }
              animate={
                isReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              transition={{
                duration: 0.34,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.div
                className="absolute inset-x-0 -bottom-1/2 h-full bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.1),transparent)]"
                animate={isReducedMotion ? undefined : { y: ["120%", "-300%"] }}
                transition={
                  isReducedMotion
                    ? undefined
                    : {
                      duration: 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                      delay: index * 0.05,
                    }
                }
              />
            </motion.div>
          ))}
        </div>

        <div className="flex min-h-8 items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={stageLabel}
              className="text-muted-foreground text-sm"
              initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {stageLabel}
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.div
          initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.24, delay: 0.18, ease: "easeOut" }}
        >
          <Loader2 className="text-muted-foreground/80 size-5 animate-spin" />
        </motion.div>
      </div>
    </motion.div>
  );
}
