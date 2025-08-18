"use client";

import { useMemo, useState } from "react";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";

type Scene = {
  id: string;
  label: string;
  src: string;
  // Best guess defaults; user can edit to ensure accuracy
  baseFocalMm: number;
  aspectHint?: "16:9" | "3:2" | "4:3";
};

const SCENES: Scene[] = [
  {
    id: "city-24mm",
    label: "City street (wide)",
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop",
    baseFocalMm: 24,
    aspectHint: "3:2",
  },
  {
    id: "portrait-85mm",
    label: "Portrait (85mm)",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1600&auto=format&fit=crop",
    baseFocalMm: 85,
    aspectHint: "3:2",
  },
  {
    id: "landscape-35mm",
    label: "Landscape (35mm)",
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
    baseFocalMm: 35,
    aspectHint: "3:2",
  },
];

function formatMm(value: number): string {
  return `${Math.round(value)}mm`;
}

export default function FocalSimulatorPage() {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(SCENES[0].id);
  const selectedScene = SCENES.find((s) => s.id === selectedSceneId)!;

  // Target focal starts at the next common step above the capture focal
  const nextPresetAbove = (base: number) =>
    [35, 50, 85, 105, 135, 200, 300, 400].find((p) => p > base) ?? base;
  const [targetFocalMm, setTargetFocalMm] = useState<number>(
    nextPresetAbove(selectedScene.baseFocalMm),
  );

  // Keep base params in sync when switching scenes, but allow user overrides
  const onSelectScene = (id: string) => {
    setSelectedSceneId(id);
    const scene = SCENES.find((s) => s.id === id)!;
    setTargetFocalMm(nextPresetAbove(scene.baseFocalMm));
  };

  const baseFocalMm = selectedScene.baseFocalMm;
  const baseUrl = selectedScene.src;

  // Ratio between target and base FOVs (k > 1 means narrower target, so zoom/crop in).
  // We only allow tighter (target >= base), so k >= 1.
  const k = useMemo(() => {
    const numerator = targetFocalMm;
    const denominator = baseFocalMm;
    if (
      !Number.isFinite(numerator) ||
      !Number.isFinite(denominator) ||
      denominator === 0
    )
      return 1;
    return Math.max(1, numerator / denominator);
  }, [baseFocalMm, targetFocalMm]);

  const zoomScale = k;

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Focal Length Simulator</h1>
        <p className="text-muted-foreground text-sm">
          Pick a scene captured at a known focal length, then explore how
          tighter focal lengths would frame the same scene.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Scene</Label>
              <div className="grid grid-cols-3 gap-2">
                {SCENES.map((scene) => (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => onSelectScene(scene.id)}
                    className={cn(
                      "group relative aspect-video overflow-hidden rounded border",
                      selectedSceneId === scene.id
                        ? "border-primary ring-primary/30 ring-2"
                        : "border-border",
                    )}
                    aria-pressed={selectedSceneId === scene.id}
                  >
                    <img
                      src={scene.src}
                      alt={scene.label}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      crossOrigin="anonymous"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-black/40 px-1 py-0.5 text-[10px] text-white">
                      {scene.label} · Captured {formatMm(scene.baseFocalMm)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tighter focal length</Label>
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">
                  Captured at {formatMm(baseFocalMm)} · Showing{" "}
                  {formatMm(targetFocalMm)}
                </div>
                <div className="px-1">
                  <Slider
                    min={baseFocalMm}
                    max={400}
                    step={1}
                    value={[targetFocalMm]}
                    onValueChange={(vals) =>
                      setTargetFocalMm(Math.max(baseFocalMm, vals[0] as number))
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {[35, 50, 85, 105, 135, 200, 300, 400]
                    .filter((p) => p > baseFocalMm)
                    .map((p) => (
                      <Button
                        key={p}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setTargetFocalMm(p)}
                      >
                        {p}
                      </Button>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-hidden rounded-md border bg-black">
              <div
                className={cn(
                  "relative w-full",
                  selectedScene.aspectHint === "4:3"
                    ? "aspect-[4/3]"
                    : selectedScene.aspectHint === "16:9"
                      ? "aspect-video"
                      : "aspect-[3/2]",
                )}
              >
                {/* Base image, scaled by zoomScale to simulate narrower FOV */}
                <img
                  src={baseUrl}
                  alt={selectedScene.label}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: "center center",
                  }}
                  crossOrigin="anonymous"
                />

                {/* No guides; the viewport shows the simulated tighter framing */}
              </div>
            </div>
            <div className="text-muted-foreground mt-3 text-xs">
              Captured at {formatMm(baseFocalMm)} · Showing{" "}
              {formatMm(targetFocalMm)} (tighter)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
