"use client";

import { useMemo, useState, useEffect } from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Button } from "~/components/ui/button";

export interface FocalLengthInputChange {
  focalLengthMinMm: number | null;
  focalLengthMaxMm: number | null;
  isPrime: boolean;
}

export interface FocalLengthInputProps {
  id?: string;
  label?: string;
  minValue?: number | null;
  maxValue?: number | null;
  onChange: (values: FocalLengthInputChange) => void;
  disabled?: boolean;
  className?: string;
}

const FocalLengthInput = ({
  id = "focal-length",
  label = "Focal Length (mm)",
  minValue,
  maxValue,
  onChange,
  disabled = false,
  className = "",
}: FocalLengthInputProps) => {
  // Initialize mode once from incoming values
  const initialMode: "PRIME" | "ZOOM" = useMemo(() => {
    if (
      typeof minValue === "number" &&
      typeof maxValue === "number" &&
      minValue === maxValue
    ) {
      return "PRIME";
    }
    return "ZOOM";
  }, [minValue, maxValue]);

  const [mode, setMode] = useState<"PRIME" | "ZOOM">(initialMode);
  const [min, setMin] = useState<number | null>(minValue ?? null);
  const [max, setMax] = useState<number | null>(maxValue ?? null);

  // Keep local state synced with incoming values and derive mode
  useEffect(() => {
    const nextMin = minValue ?? null;
    const nextMax = maxValue ?? null;
    setMin(nextMin);
    setMax(nextMax);
    if (typeof nextMin === "number" && typeof nextMax === "number") {
      setMode(nextMin === nextMax ? "PRIME" : "ZOOM");
    }
  }, [minValue, maxValue]);

  const emit = (
    nextMin: number | null,
    nextMax: number | null,
    nextMode?: "PRIME" | "ZOOM",
  ) => {
    // Debug: emit up
    const effectiveMode = nextMode ?? mode;
    console.log("[FocalLengthInput] emit", {
      nextMin,
      nextMax,
      mode: effectiveMode,
    });
    onChange({
      focalLengthMinMm: nextMin,
      focalLengthMaxMm: nextMax,
      isPrime: effectiveMode === "PRIME",
    });
  };

  const handleMinChange = (raw: string) => {
    const parsed = raw === "" ? null : Number(raw);
    setMin(parsed);
    if (mode === "PRIME") {
      setMax(parsed);
      emit(parsed, parsed);
    } else {
      emit(parsed, max);
    }
  };

  const handleMaxChange = (raw: string) => {
    const parsed = raw === "" ? null : Number(raw);
    setMax(parsed);
    emit(min, parsed);
  };

  const switchTo = (nextMode: "PRIME" | "ZOOM") => {
    setMode(nextMode);
    console.log("[FocalLengthInput] switchTo", { nextMode, min, max });
    if (nextMode === "PRIME") {
      // lock values together using min
      const locked = min ?? max ?? null;
      setMin(locked);
      setMax(locked);
      emit(locked, locked, nextMode);
    } else {
      // ensure max is >= min when switching to zoom
      const base = min ?? 1;
      const ensuredMax = max == null || max < base ? base + 1 : max;
      setMax(ensuredMax);
      emit(min ?? base, ensuredMax, nextMode);
    }
  };

  const isPrime = mode === "PRIME";

  return (
    <div className={className}>
      <div className="space-y-2">
        <Label htmlFor={id}>Lens Type</Label>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(val) => val && switchTo(val as "PRIME" | "ZOOM")}
          className="w-fit"
          size="sm"
          variant="outline"
        >
          <ToggleGroupItem value="PRIME">Prime</ToggleGroupItem>
          <ToggleGroupItem value="ZOOM">Zoom</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="mt-3 space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${id}-min`}>
            {isPrime ? "Focal Length (mm)" : "Focal Length Min (mm)"}
          </Label>
          <Input
            id={`${id}-min`}
            type="number"
            value={min ?? ""}
            onChange={(e) => handleMinChange(e.target.value)}
            min={0.1}
            step={0.1}
            placeholder="e.g., 35"
            disabled={disabled}
          />
        </div>

        <div className={isPrime ? "pointer-events-none opacity-50" : undefined}>
          <div className="space-y-2">
            <Label
              htmlFor={`${id}-max`}
              className={isPrime ? "text-muted-foreground" : undefined}
            >
              Focal Length Max (mm)
            </Label>
            <Input
              id={`${id}-max`}
              type="number"
              value={max ?? ""}
              onChange={(e) => handleMaxChange(e.target.value)}
              min={min ?? 0.1}
              step={0.1}
              placeholder="e.g., 70"
              disabled={disabled || isPrime}
            />
          </div>
        </div>

        {/* Preset chips */}
        <div className="flex flex-wrap gap-2">
          {[
            "28",
            "35",
            "50",
            "85",
            "135",
            "24-70",
            "70-200",
            "400",
            "600",
            "800",
          ].map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (preset.includes("-")) {
                  const [pMin, pMax] = preset
                    .split("-")
                    .map((n) => Number(n)) as [number, number];
                  switchTo("ZOOM");
                  setMin(pMin);
                  setMax(pMax);
                  emit(pMin, pMax, "ZOOM");
                } else {
                  const p = Number(preset);
                  switchTo("PRIME");
                  setMin(p);
                  setMax(p);
                  emit(p, p, "PRIME");
                }
              }}
            >
              {preset}mm
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FocalLengthInput;
