"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";

export function GradientImageTool() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [bg, setBg] = useState<HTMLImageElement | null>(null);
  const [width, setWidth] = useState<number>(1000);
  const [height, setHeight] = useState<number>(750);
  const [paddingPct, setPaddingPct] = useState<number>(20);
  const [format, setFormat] = useState<"png" | "webp">("webp");

  const onFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      URL.revokeObjectURL(url);
      requestAnimationFrame(() => draw());
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, []);

  // Load background once from public
  useEffect(() => {
    const bgImg = new Image();
    bgImg.src = "/thumbnail-bg.jpg";
    bgImg.onload = () => setBg(bgImg);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.max(1, Math.floor(width));
    canvas.height = Math.max(1, Math.floor(height));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background image (cover)
    if (bg) {
      const scale = Math.max(
        canvas.width / bg.width,
        canvas.height / bg.height,
      );
      const drawW = Math.max(1, Math.floor(bg.width * scale));
      const drawH = Math.max(1, Math.floor(bg.height * scale));
      const dx = Math.floor((canvas.width - drawW) / 2);
      const dy = Math.floor((canvas.height - drawH) / 2);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bg, dx, dy, drawW, drawH);
    } else {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw image centered with padding and preserving aspect ratio
    if (image) {
      const padding =
        (paddingPct / 100) * Math.min(canvas.width, canvas.height);
      const maxW = canvas.width - padding * 2;
      const maxH = canvas.height - padding * 2;
      const scale = Math.min(maxW / image.width, maxH / image.height);
      const drawW = Math.max(1, Math.floor(image.width * scale));
      const drawH = Math.max(1, Math.floor(image.height * scale));
      const dx = Math.floor((canvas.width - drawW) / 2);
      const dy = Math.floor((canvas.height - drawH) / 2);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, dx, dy, drawW, drawH);
    }
  }, [width, height, image, paddingPct, bg]);

  const onDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const mime = format === "png" ? "image/png" : "image/webp";
    link.download = `image-${width}x${height}.${format}`;
    link.href = canvas.toDataURL(mime);
    link.click();
  }, [width, height, format]);

  // Redraw on control changes
  useEffect(() => {
    requestAnimationFrame(() => draw());
  }, [width, height, image, paddingPct, bg, draw]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thumbnail Background Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Transparent Product Image</Label>
              <Input
                id="file"
                type="file"
                accept="image/png,image/webp,image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFile(file);
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  type="number"
                  min={1}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value || 0))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  type="number"
                  min={1}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value || 0))}
                />
              </div>
            </div>

            {/* Gradient controls removed in favor of thumbnail background */}

            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <select
                id="format"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={format}
                onChange={(e) => setFormat(e.target.value as "png" | "webp")}
              >
                <option value="webp">WEBP (default)</option>
                <option value="png">PNG</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Padding ({paddingPct}%)</Label>
              <Slider
                value={[paddingPct]}
                min={10}
                max={20}
                step={1}
                onValueChange={(vals) => setPaddingPct(vals[0] ?? paddingPct)}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={() => draw()} disabled={!image}>
                Render
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onDownload}
                disabled={!image}
              >
                {`Download ${format.toUpperCase()}`}
              </Button>
            </div>
          </div>

          <div className="rounded-md border p-2">
            <canvas
              ref={canvasRef}
              className="max-h-[60vh] w-full rounded-sm bg-transparent"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((c) => c + c)
          .join("")
      : sanitized,
    16,
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
