"use client";
import React, { useCallback, useMemo } from "react";
import { useField, FieldLabel, FieldDescription } from "@payloadcms/ui";

// Lightweight slider using an <input type="range"> to avoid adding new UI deps
// Value is number | null. When null, slider is visually dimmed and thumb is disabled until clicked.

type NullableSliderProps = {
  name?: string;
  label?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  path?: string;
  field?: {
    name?: string;
    label?: string;
    admin?: { description?: string; className?: string };
    min?: number;
    max?: number;
    step?: number;
  };
};

const NullableSlider: React.FC<NullableSliderProps> = (props) => {
  const effectivePath =
    props.path ?? props.field?.name ?? props.name ?? "slider";
  const effectiveLabel = props.field?.label ?? props.label ?? "Rating";
  const effectiveDescription =
    props.field?.admin?.description ?? props.description;
  const min = props.field?.min ?? props.min ?? 0;
  const max = props.field?.max ?? props.max ?? 100;
  const step = props.field?.step ?? props.step ?? 1;

  const { value, setValue } = useField<number | null>({ path: effectivePath });

  const isUnset =
    value === null || value === undefined || Number.isNaN(value as number);
  const displayValue = useMemo(() => {
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    // Center as neutral when unset
    return Math.round((min + max) / 2);
  }, [value, min, max]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(e.target.value);
      if (Number.isNaN(next)) {
        setValue(null);
      } else {
        setValue(next);
      }
    },
    [setValue],
  );

  const handleActivate = useCallback(() => {
    if (isUnset) setValue(displayValue);
  }, [isUnset, setValue, displayValue]);

  return (
    <div
      className={`sharply-field flex flex-col gap-1 py-2 ${props.field?.admin?.className ?? ""}`}
    >
      <FieldLabel label={effectiveLabel} path={effectivePath} />
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={handleChange}
          onMouseDown={handleActivate}
          onTouchStart={handleActivate}
          className={`bg-muted h-2 w-full cursor-pointer appearance-none rounded-md ${
            isUnset ? "opacity-50" : "opacity-100"
          }`}
        />
        <div
          className={`w-10 text-right text-xs tabular-nums ${isUnset ? "opacity-50" : ""}`}
        >
          {isUnset ? "—" : String(displayValue)}
        </div>
        <button
          type="button"
          className="text-muted-foreground text-xs underline"
          onClick={() => setValue(null)}
        >
          Clear
        </button>
      </div>
      {effectiveDescription && (
        <FieldDescription
          description={effectiveDescription}
          path={effectivePath}
        />
      )}
    </div>
  );
};

export default NullableSlider;
