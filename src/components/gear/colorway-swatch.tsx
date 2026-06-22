"use client";

import { forwardRef } from "react";
import { cn } from "~/lib/utils";

type ColorwaySwatchProps = {
  colorA: string;
  colorB: string;
  label?: string;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
};

const sizeClasses = {
  sm: "size-5",
  md: "size-8",
  lg: "size-16",
};

export const ColorwaySwatch = forwardRef<
  HTMLButtonElement,
  ColorwaySwatchProps
>(function ColorwaySwatch(
  {
    colorA,
    colorB,
    label,
    selected = false,
    size = "md",
    interactive = false,
    className,
    onClick,
  },
  ref,
) {
  const swatchClassName = cn(
    "shrink-0 rounded-full border border-border shadow-sm",
    sizeClasses[size],
    selected && "ring-ring ring-2 ring-offset-2 ring-offset-background",
    interactive &&
      "cursor-pointer transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className,
  );
  const style = {
    background: `linear-gradient(135deg, ${colorA} 0 48.5%, var(--border) 48.5% 51.5%, ${colorB} 51.5% 100%)`,
  };

  if (interactive) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={selected}
        className={swatchClassName}
        onClick={onClick}
        style={style}
      />
    );
  }

  return <span aria-hidden="true" className={swatchClassName} style={style} />;
});
