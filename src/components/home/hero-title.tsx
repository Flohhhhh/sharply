"use client";

import { DiaTextReveal } from "~/components/ui/dia-text-reveal";
import { cn } from "~/lib/utils";

interface HeroTitleProps {
  line1: string;
  line2LeadIn: string;
  rotatingWords: string[];
  className?: string;
}

export function HeroTitle({
  line1,
  line2LeadIn,
  rotatingWords,
  className,
}: HeroTitleProps) {
  return (
    <h1
      className={cn(
        "mb-12 text-3xl font-bold tracking-tight leading-tight md:text-7xl",
        className,
      )}
    >
      <span className="block">{line1}</span>
      <span className="flex items-baseline justify-center overflow-visible">
        {line2LeadIn}
        <DiaTextReveal
          text={rotatingWords}
          repeat
          once={false}
          startOnView
          repeatDelay={2.5}
          duration={1.1}
          animateWidth
          exitAnimation="fade"
          exitDuration={0.3}
          className={line2LeadIn ? "ms-[0.25em]" : undefined}
        />
      </span>
    </h1>
  );
}
