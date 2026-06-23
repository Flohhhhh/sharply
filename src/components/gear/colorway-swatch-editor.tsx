"use client";

import { useState } from "react";

import { ColorwaySwatch } from "~/components/gear/colorway-swatch";
import { Button } from "~/components/ui/button";
import {
  ColorPickerPanel,
  parseHexColor,
  rgbaToHex,
} from "~/components/ui/color-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

const PRESETS = [
  { key: "black", value: "#171717" },
  { key: "gray", value: "#737373" },
  { key: "white", value: "#FAFAFA" },
] as const;

type SwatchEditorLabels = {
  edit: string;
  title: string;
  colorA: string;
  colorB: string;
  hex: string;
  hue: string;
  saturationLightness: string;
  presets: string;
  black: string;
  gray: string;
  white: string;
  lightPreview: string;
  darkPreview: string;
  apply: string;
  cancel: string;
};

type ColorwaySwatchEditorProps = {
  colorA: string;
  colorB: string;
  labels: SwatchEditorLabels;
  disabled?: boolean;
  onApply: (colors: { colorA: string; colorB: string }) => Promise<void> | void;
};

const FALLBACK_COLOR = { r: 115, g: 115, b: 115, a: 1 };

export function ColorwaySwatchEditor({
  colorA,
  colorB,
  labels,
  disabled = false,
  onApply,
}: ColorwaySwatchEditorProps) {
  const [open, setOpen] = useState(false);
  const [draftA, setDraftA] = useState(colorA);
  const [draftB, setDraftB] = useState(colorB);
  const [activeSide, setActiveSide] = useState<"a" | "b">("a");
  const [saving, setSaving] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftA(colorA);
      setDraftB(colorB);
      setActiveSide("a");
    }
    setOpen(nextOpen);
  }

  const activeColor = activeSide === "a" ? draftA : draftB;

  async function apply() {
    setSaving(true);
    try {
      await onApply({ colorA: draftA, colorB: draftB });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ColorwaySwatch
          colorA={colorA}
          colorB={colorB}
          label={labels.edit}
          interactive
          selected={open}
        />
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <div className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{labels.title}</DialogTitle>
            <DialogDescription>{labels.edit}</DialogDescription>
          </DialogHeader>

          <ToggleGroup
            type="single"
            variant="outline"
            className="w-full"
            value={activeSide}
            onValueChange={(value) => {
              if (value === "a" || value === "b") setActiveSide(value);
            }}
          >
            <ToggleGroupItem value="a">{labels.colorA}</ToggleGroupItem>
            <ToggleGroupItem value="b">{labels.colorB}</ToggleGroupItem>
          </ToggleGroup>

          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs font-medium">
              {activeSide === "a" ? labels.colorA : labels.colorB}
            </p>
            <ColorPickerPanel
              value={parseHexColor(activeColor) ?? FALLBACK_COLOR}
              onValueChange={(value) => {
                const nextColor = rgbaToHex(value);
                if (activeSide === "a") setDraftA(nextColor);
                else setDraftB(nextColor);
              }}
              opacityEnabled={false}
              labels={{
                hex: labels.hex,
                alpha: labels.hex,
                hue: labels.hue,
                saturationLightness: labels.saturationLightness,
                opacity: labels.hue,
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs font-medium">
              {labels.presets}
            </p>
            <ToggleGroup
              type="single"
              variant="outline"
              value={
                PRESETS.find((preset) => preset.value === activeColor)?.key ??
                ""
              }
              onValueChange={(key) => {
                const preset = PRESETS.find((item) => item.key === key);
                if (!preset) return;
                if (activeSide === "a") setDraftA(preset.value);
                else setDraftB(preset.value);
              }}
            >
              {PRESETS.map((preset) => (
                <ToggleGroupItem key={preset.key} value={preset.key}>
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full border"
                    style={{ backgroundColor: preset.value }}
                  />
                  {labels[preset.key]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="flex flex-col items-center gap-2 rounded-md border p-4"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <ColorwaySwatch colorA={draftA} colorB={draftB} size="lg" />
              <span className="text-xs text-black">{labels.lightPreview}</span>
            </div>
            <div
              className="flex flex-col items-center gap-2 rounded-md border p-4"
              style={{ backgroundColor: "#171717" }}
            >
              <ColorwaySwatch colorA={draftA} colorB={draftB} size="lg" />
              <span className="text-xs text-white">{labels.darkPreview}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              {labels.cancel}
            </Button>
            <Button type="button" disabled={disabled || saving} onClick={apply}>
              {labels.apply}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
