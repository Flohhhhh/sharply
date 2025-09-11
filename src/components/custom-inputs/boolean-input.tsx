"use client";
import { CircleSlash, InfoIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
export interface BooleanInputProps {
  id: string;
  label: string;
  checked: boolean | null;
  onChange: (value: boolean | null) => void;
  className?: string;
  disabled?: boolean;
  allowNull?: boolean; // when true, cycles null -> true -> false -> null
  showStateText?: boolean; // optionally render Yes/No/Unset text beside control
  nullLabel?: string; // customize label for null state
  tooltip?: ReactNode; // optional tooltip content rendered next to label
}

export function BooleanInput({
  id,
  label,
  checked,
  onChange,
  className = "",
  disabled = false,
  allowNull = false,
  showStateText = false,
  nullLabel = "N/A",
  tooltip,
}: BooleanInputProps) {
  const labelId = `${id}-label`;
  const ariaChecked = checked === null ? "mixed" : checked;
  const cycle = () => {
    if (!allowNull) {
      onChange(!Boolean(checked));
      return;
    }
    // null -> true -> false -> null
    if (checked === null) return onChange(true);
    if (checked === true) return onChange(false);
    return onChange(null);
  };

  const setFromKey = (key: string) => {
    if (!allowNull) {
      if (key === "ArrowLeft") return onChange(false);
      if (key === "ArrowRight") return onChange(true);
      if (key === "Enter" || key === " ") return onChange(!Boolean(checked));
      return;
    }
    if (key === "ArrowLeft") return onChange(false);
    if (key === "ArrowRight") return onChange(true);
    if (key === "Backspace" || key === "Escape") return onChange(null);
    if (key === "Enter" || key === " ") return cycle();
  };

  const trackBgClass =
    checked === true
      ? "bg-green-500"
      : checked === false
        ? "bg-red-500"
        : "bg-muted";

  const knobTranslateClass =
    checked === true
      ? "translate-x-[calc(100%-2px)]"
      : checked === false
        ? "translate-x-0"
        : "translate-x-[calc(50%-0.5rem)]"; // center for null (knob is 1rem)

  // Segmented tri-state (or bi-state) control for direct selection
  if (allowNull) {
    const options: Array<{
      label: string;
      value: boolean | null;
      key: string;
    }> = [
      { label: nullLabel, value: null, key: "unset" },
      { label: "Yes", value: true, key: "yes" },
      { label: "No", value: false, key: "no" },
    ];
    const currentIndex = options.findIndex((o) => o.value === checked);
    const move = (dir: 1 | -1) => {
      const values = options.map((o) => o.value);
      const idx = currentIndex === -1 ? 0 : currentIndex;
      const next = (idx + dir + values.length) % values.length;
      onChange(values[next] as boolean | null);
    };
    const isUnset = checked === null;
    return (
      <div
        className={`my-auto flex h-fit cursor-pointer items-center justify-between rounded-md border p-3 ${isUnset ? "border-muted border-dashed" : ""} ${className}`}
        aria-disabled={disabled}
        onClick={(e) => {
          if (disabled) return;
          e.preventDefault();
          cycle();
        }}
      >
        <div className="flex items-center gap-2">
          <span id={labelId} className="text-sm select-none">
            {label}
          </span>
          {tooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="More info"
                  onClick={(e) => e.stopPropagation()}
                  className="focus-visible:ring-ring rounded-sm outline-none focus-visible:ring-2"
                >
                  <InfoIcon className="text-muted-foreground h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <div
          id={id}
          role="radiogroup"
          aria-labelledby={labelId}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "ArrowRight") {
              e.preventDefault();
              move(1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              move(-1);
            }
          }}
          className={`bg-background inline-flex items-center gap-1 rounded-md border p-1 ${disabled ? "opacity-50" : ""}`}
        >
          {options.map((opt) => {
            const selected = checked === opt.value;
            const base =
              "px-2 py-1 text-xs rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors select-none inline-flex items-center justify-center";
            const selectedClass =
              opt.value === true
                ? "bg-green-500 text-white"
                : opt.value === false
                  ? "bg-red-500 text-white"
                  : "bg-muted text-foreground";
            const unselectedClass = "text-muted-foreground hover:bg-muted";
            return (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                }}
                className={`${base} ${selected ? selectedClass : unselectedClass}`}
                title={opt.label}
                aria-label={opt.value === null ? opt.label : undefined}
              >
                {opt.value === null ? (
                  <>
                    <CircleSlash
                      className="text-muted-foreground/50 h-4 w-4"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{opt.label}</span>
                  </>
                ) : (
                  opt.label
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`my-auto flex h-fit cursor-pointer items-center justify-between rounded-md border p-3 ${checked === null ? "opacity-20" : ""} ${className}`}
      role="switch"
      aria-checked={ariaChecked as any}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        e.preventDefault();
        cycle();
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        e.preventDefault();
        setFromKey(e.key);
      }}
    >
      <div className="flex items-center gap-2">
        <span id={labelId} className="text-sm select-none">
          {label}
        </span>
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="More info"
                onClick={(e) => e.stopPropagation()}
                className="focus-visible:ring-ring rounded-sm outline-none focus-visible:ring-2"
              >
                <InfoIcon className="text-muted-foreground h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <div
        id={id}
        aria-hidden="true"
        className={`inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border transition-colors ${trackBgClass} ${disabled ? "opacity-50" : ""}`}
        title={
          showStateText
            ? undefined
            : checked === null
              ? nullLabel
              : checked
                ? "Yes"
                : "No"
        }
      >
        <span
          className={`bg-background pointer-events-none block size-4 rounded-full transition-transform ${knobTranslateClass}`}
        />
      </div>
      {showStateText && (
        <span className="text-muted-foreground ml-3 text-xs">
          {checked === null ? nullLabel : checked ? "Yes" : "No"}
        </span>
      )}
    </div>
  );
}
