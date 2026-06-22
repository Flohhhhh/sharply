"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import { cn } from "~/lib/utils";

export type RgbaColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

type HslColor = {
  h: number;
  s: number;
  l: number;
};

type SaturationLightnessPoint = {
  saturation: number;
  lightness: number;
};

type ColorPickerLabels = {
  trigger: string;
  hex: string;
  alpha: string;
  saturationLightness: string;
  hue: string;
  opacity: string;
};

const DEFAULT_LABELS: ColorPickerLabels = {
  trigger: "Select color",
  hex: "Hex",
  alpha: "Alpha",
  saturationLightness: "Saturation and lightness",
  hue: "Hue",
  opacity: "Opacity",
};

export interface ColorPickerPanelProps {
  value: RgbaColor;
  onValueChange: (value: RgbaColor) => void;
  disabled?: boolean;
  opacityEnabled?: boolean;
  className?: string;
  labels?: Partial<ColorPickerLabels>;
}

export interface ColorPickerFieldProps extends ColorPickerPanelProps {
  placeholder?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
  popoverContentClassName?: string;
}

type CommitResult = {
  nextValue: RgbaColor;
  accepted: boolean;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeRgbaColor(
  value: RgbaColor,
  opacityEnabled = true,
): RgbaColor {
  return {
    r: Math.round(clamp(value.r, 0, 255)),
    g: Math.round(clamp(value.g, 0, 255)),
    b: Math.round(clamp(value.b, 0, 255)),
    a: opacityEnabled ? clamp(value.a, 0, 1) : 1,
  };
}

export function rgbaToHex(value: RgbaColor) {
  const normalized = normalizeRgbaColor(value);
  return `#${[normalized.r, normalized.g, normalized.b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function parseHexColor(input: string): RgbaColor | null {
  const trimmed = input.trim();
  const hex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (!/^[\da-fA-F]{6}$/.test(hex)) {
    return null;
  }

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
    a: 1,
  };
}

export function parseAlphaInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed.length) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return clamp(parsed, 0, 1);
}

export function rgbaToHsl(value: RgbaColor): HslColor {
  const r = clamp(value.r, 0, 255) / 255;
  const g = clamp(value.g, 0, 255) / 255;
  const b = clamp(value.b, 0, 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation =
      delta / (1 - Math.abs(2 * lightness - 1));

    switch (max) {
      case r:
        hue = ((g - b) / delta) % 6;
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      default:
        hue = (r - g) / delta + 4;
        break;
    }

    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return {
    h: hue,
    s: saturation * 100,
    l: lightness * 100,
  };
}

function hueToRgb(p: number, q: number, t: number) {
  let value = t;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
}

export function hslToRgba(hsl: HslColor, alpha = 1): RgbaColor {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;

  if (s === 0) {
    const grey = Math.round(l * 255);
    return normalizeRgbaColor({ r: grey, g: grey, b: grey, a: alpha });
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;

  return normalizeRgbaColor({
    r: Math.round(hueToRgb(p, q, hk + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hk) * 255),
    b: Math.round(hueToRgb(p, q, hk - 1 / 3) * 255),
    a: alpha,
  });
}

export function applyHueToColor(value: RgbaColor, hue: number): RgbaColor {
  const hsl = rgbaToHsl(value);
  return hslToRgba(
    {
      h: hue,
      s: hsl.s,
      l: hsl.l,
    },
    value.a,
  );
}

export function applySaturationLightnessToColor(
  value: RgbaColor,
  saturation: number,
  lightness: number,
): RgbaColor {
  const hsl = rgbaToHsl(value);
  return hslToRgba(
    {
      h: hsl.h,
      s: saturation,
      l: lightness,
    },
    value.a,
  );
}

export function getSaturationLightnessFromPointerPosition(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): SaturationLightnessPoint {
  const x = rect.width > 0 ? clamp((clientX - rect.left) / rect.width, 0, 1) : 0;
  const y =
    rect.height > 0 ? clamp((clientY - rect.top) / rect.height, 0, 1) : 0;

  return {
    saturation: x * 100,
    lightness: (1 - y) * 100,
  };
}

export function commitHexInput(
  currentValue: RgbaColor,
  input: string,
  opacityEnabled = false,
): CommitResult {
  const parsed = parseHexColor(input);
  if (!parsed) {
    return {
      nextValue: normalizeRgbaColor(currentValue, opacityEnabled),
      accepted: false,
    };
  }

  return {
    nextValue: normalizeRgbaColor(
      { ...parsed, a: opacityEnabled ? currentValue.a : 1 },
      opacityEnabled,
    ),
    accepted: true,
  };
}

export function commitAlphaInput(
  currentValue: RgbaColor,
  input: string,
  opacityEnabled = false,
): CommitResult {
  if (!opacityEnabled) {
    return {
      nextValue: normalizeRgbaColor({ ...currentValue, a: 1 }, false),
      accepted: false,
    };
  }

  const alpha = parseAlphaInput(input);
  if (alpha == null) {
    return {
      nextValue: normalizeRgbaColor(currentValue, true),
      accepted: false,
    };
  }

  return {
    nextValue: normalizeRgbaColor({ ...currentValue, a: alpha }, true),
    accepted: true,
  };
}

function getLabels(labels?: Partial<ColorPickerLabels>): ColorPickerLabels {
  return { ...DEFAULT_LABELS, ...labels };
}

function getAlphaText(value: number) {
  const fixed = clamp(value, 0, 1).toFixed(2);
  return fixed.replace(/0+$/, "").replace(/\.$/, "") || "0";
}

function CheckerboardSwatch({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block overflow-hidden rounded-sm border border-border/80",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%, transparent 75%, hsl(var(--muted)) 75%, hsl(var(--muted)))," +
          "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%, transparent 75%, hsl(var(--muted)) 75%, hsl(var(--muted)))",
        backgroundPosition: "0 0, 4px 4px",
        backgroundSize: "8px 8px",
      }}
    >
      <span
        className="absolute inset-0"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

export function ColorPickerPanel({
  value,
  onValueChange,
  disabled = false,
  opacityEnabled = false,
  className,
  labels,
}: ColorPickerPanelProps) {
  const resolvedLabels = getLabels(labels);
  const normalizedValue = React.useMemo(
    () => normalizeRgbaColor(value, opacityEnabled),
    [opacityEnabled, value],
  );
  const hsl = React.useMemo(() => rgbaToHsl(normalizedValue), [normalizedValue]);
  const [hexInput, setHexInput] = React.useState(() => rgbaToHex(normalizedValue));
  const [alphaInput, setAlphaInput] = React.useState(() =>
    getAlphaText(normalizedValue.a),
  );
  const [isEditingHex, setIsEditingHex] = React.useState(false);
  const [isEditingAlpha, setIsEditingAlpha] = React.useState(false);
  const saturationRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isEditingHex) {
      setHexInput(rgbaToHex(normalizedValue));
    }
  }, [isEditingHex, normalizedValue]);

  React.useEffect(() => {
    if (!isEditingAlpha) {
      setAlphaInput(getAlphaText(normalizedValue.a));
    }
  }, [isEditingAlpha, normalizedValue.a]);

  const emitValue = React.useCallback(
    (nextValue: RgbaColor) => {
      if (disabled) return;
      onValueChange(normalizeRgbaColor(nextValue, opacityEnabled));
    },
    [disabled, onValueChange, opacityEnabled],
  );

  const updateFromPointer = React.useCallback(
    (clientX: number, clientY: number) => {
      if (disabled || !saturationRef.current) return;
      const rect = saturationRef.current.getBoundingClientRect();
      const next = getSaturationLightnessFromPointerPosition(clientX, clientY, rect);
      emitValue(
        applySaturationLightnessToColor(
          normalizedValue,
          next.saturation,
          next.lightness,
        ),
      );
    },
    [disabled, emitValue, normalizedValue],
  );

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      updateFromPointer(event.clientX, event.clientY);
    },
    [disabled, updateFromPointer],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !(event.buttons & 1)) return;
      updateFromPointer(event.clientX, event.clientY);
    },
    [disabled, updateFromPointer],
  );

  const handleSaturationKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const step = event.shiftKey ? 5 : 1;
      let nextS = hsl.s;
      let nextL = hsl.l;
      if (event.key === "ArrowLeft") nextS -= step;
      else if (event.key === "ArrowRight") nextS += step;
      else if (event.key === "ArrowUp") nextL += step;
      else if (event.key === "ArrowDown") nextL -= step;
      else return;

      event.preventDefault();
      emitValue(
        applySaturationLightnessToColor(normalizedValue, nextS, nextL),
      );
    },
    [disabled, emitValue, hsl.l, hsl.s, normalizedValue],
  );

  const commitHex = React.useCallback(() => {
    const result = commitHexInput(normalizedValue, hexInput, opacityEnabled);
    setHexInput(rgbaToHex(result.nextValue));
    if (result.accepted) {
      emitValue(result.nextValue);
    }
  }, [emitValue, hexInput, normalizedValue, opacityEnabled]);

  const commitAlpha = React.useCallback(() => {
    const result = commitAlphaInput(normalizedValue, alphaInput, opacityEnabled);
    setAlphaInput(getAlphaText(result.nextValue.a));
    if (result.accepted) {
      emitValue(result.nextValue);
    }
  }, [alphaInput, emitValue, normalizedValue, opacityEnabled]);

  const pointerLeft = `${hsl.s}%`;
  const pointerTop = `${100 - hsl.l}%`;
  const huePreview = `hsl(${Math.round(hsl.h)} 100% 50%)`;
  const rgbaCss = `rgba(${normalizedValue.r}, ${normalizedValue.g}, ${normalizedValue.b}, ${normalizedValue.a})`;

  return (
    <div className={cn("space-y-3", className)} data-disabled={disabled || undefined}>
      <div className="space-y-1.5">
        <Label className="sr-only">{resolvedLabels.saturationLightness}</Label>
        <div
          ref={saturationRef}
          aria-label={resolvedLabels.saturationLightness}
          aria-disabled={disabled}
          className={cn(
            "relative h-36 w-full rounded-md border border-input outline-none",
            disabled && "pointer-events-none opacity-60",
          )}
          onKeyDown={handleSaturationKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          role="application"
          tabIndex={disabled ? -1 : 0}
          style={{
            backgroundColor: huePreview,
            backgroundImage:
              "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-transparent shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
            style={{ left: pointerLeft, top: pointerTop }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="color-picker-hue">
          {resolvedLabels.hue}
        </Label>
        <Slider
          aria-label={resolvedLabels.hue}
          className={cn(
            "[&_[data-slot=slider-range]]:bg-transparent",
            "[&_[data-slot=slider-track]]:bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]",
          )}
          disabled={disabled}
          id="color-picker-hue"
          max={360}
          min={0}
          onValueChange={(values) => {
            emitValue(applyHueToColor(normalizedValue, values[0] ?? 0));
          }}
          step={1}
          value={[hsl.h]}
        />
      </div>

      {opacityEnabled ? (
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="color-picker-alpha-slider">
            {resolvedLabels.opacity}
          </Label>
          <Slider
            aria-label={resolvedLabels.opacity}
            className={cn(
              "[&_[data-slot=slider-range]]:bg-transparent",
              "[&_[data-slot=slider-track]]:bg-[linear-gradient(to_right,rgba(0,0,0,0),rgba(0,0,0,1))]",
            )}
            disabled={disabled}
            id="color-picker-alpha-slider"
            max={100}
            min={0}
            onValueChange={(values) => {
              emitValue({
                ...normalizedValue,
                a: clamp((values[0] ?? 100) / 100, 0, 1),
              });
            }}
            step={1}
            value={[normalizedValue.a * 100]}
          />
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-2",
          opacityEnabled ? "grid-cols-[minmax(0,1fr)_5rem]" : "grid-cols-1",
        )}
      >
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="color-picker-hex">
            {resolvedLabels.hex}
          </Label>
          <Input
            aria-label={resolvedLabels.hex}
            disabled={disabled}
            id="color-picker-hex"
            inputMode="text"
            onBlur={() => {
              setIsEditingHex(false);
              commitHex();
            }}
            onChange={(event) => {
              setIsEditingHex(true);
              setHexInput(event.currentTarget.value);
            }}
            onFocus={() => setIsEditingHex(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitHex();
                event.currentTarget.blur();
              }
            }}
            spellCheck={false}
            value={hexInput}
          />
        </div>

        {opacityEnabled ? (
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="color-picker-alpha">
              {resolvedLabels.alpha}
            </Label>
            <Input
              aria-label={resolvedLabels.alpha}
              disabled={disabled}
              id="color-picker-alpha"
              inputMode="decimal"
              onBlur={() => {
                setIsEditingAlpha(false);
                commitAlpha();
              }}
              onChange={(event) => {
                setIsEditingAlpha(true);
                setAlphaInput(event.currentTarget.value);
              }}
              onFocus={() => setIsEditingAlpha(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitAlpha();
                  event.currentTarget.blur();
                }
              }}
              value={alphaInput}
            />
          </div>
        ) : null}
      </div>

      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <CheckerboardSwatch className="h-4 w-4 shrink-0" color={rgbaCss} />
        <span>{rgbaCss}</span>
      </div>
    </div>
  );
}

export function ColorPickerField({
  value,
  onValueChange,
  disabled = false,
  opacityEnabled = false,
  className,
  placeholder,
  labels,
  open,
  onOpenChange,
  triggerClassName,
  popoverContentClassName,
}: ColorPickerFieldProps) {
  const resolvedLabels = getLabels(labels);
  const normalizedValue = React.useMemo(
    () => normalizeRgbaColor(value, opacityEnabled),
    [opacityEnabled, value],
  );
  const hexValue = rgbaToHex(normalizedValue);
  const displayValue = placeholder?.trim().length ? placeholder : hexValue;
  const rgbaCss = `rgba(${normalizedValue.r}, ${normalizedValue.g}, ${normalizedValue.b}, ${normalizedValue.a})`;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          aria-disabled={disabled}
          aria-label={resolvedLabels.trigger}
          className={cn(
            "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full min-w-0 items-center gap-2 rounded-md border px-3 py-1 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
            className,
            triggerClassName,
          )}
          disabled={disabled}
          type="button"
        >
          <CheckerboardSwatch className="h-4 w-4 shrink-0" color={rgbaCss} />
          <span className="min-w-0 flex-1 truncate">{displayValue}</span>
          <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-64 p-3", popoverContentClassName)}
      >
        <ColorPickerPanel
          disabled={disabled}
          labels={resolvedLabels}
          onValueChange={onValueChange}
          opacityEnabled={opacityEnabled}
          value={normalizedValue}
        />
      </PopoverContent>
    </Popover>
  );
}

export function ColorPickerCheckIcon(props: React.ComponentProps<typeof Check>) {
  return <Check {...props} />;
}
