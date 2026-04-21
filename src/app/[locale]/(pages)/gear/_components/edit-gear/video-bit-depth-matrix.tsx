"use client";

import { useMemo, useCallback, useRef, useState } from "react";
import { Crop } from "lucide-react";
import { cn } from "~/lib/utils";
import { bitDepthClass } from "~/lib/video/colors";

type CropBrushState = boolean | null | "CLEAR";

type VideoBitDepthMatrixProps = {
  resolutions: { key: string; label: string }[];
  fpsSelections: Record<string, number[]>;
  bitDepthOptions: number[];
  maxBitDepth: number;
  assignments: Record<string, Record<string, number>>;
  cropAssignments: Record<string, Record<string, boolean>>;
  onBitDepthChange: (resolutionKey: string, fps: number, value: string) => void;
  onCropChange: (resolutionKey: string, fps: number, value: boolean) => void;
};

export function VideoBitDepthMatrix({
  resolutions,
  fpsSelections,
  bitDepthOptions,
  maxBitDepth,
  assignments,
  cropAssignments,
  onBitDepthChange,
  onCropChange,
}: VideoBitDepthMatrixProps) {
  const fpsValues = useMemo(() => {
    const set = new Set<number>();
    for (const list of Object.values(fpsSelections)) {
      (list ?? []).forEach((fps) => set.add(fps));
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [fpsSelections]);

  const bitDepthBrushRef = useRef<number | null | "CLEAR">(null);
  const cropBrushRef = useRef<CropBrushState>(null);
  const isDraggingRef = useRef(false);
  const [activeBitBrush, setActiveBitBrush] = useState<number | "CLEAR" | null>(
    null,
  );
  const [activeCropBrush, setActiveCropBrush] = useState<
    "SET" | "CLEAR" | null
  >(null);

  const applyBitDepth = useCallback(
    (resolutionKey: string, fps: number) => {
      const brushDepth = bitDepthBrushRef.current;
      if (brushDepth === "CLEAR") {
        onBitDepthChange(resolutionKey, fps, "");
        return;
      }
      if (brushDepth == null) return;
      const currentDepth = assignments[resolutionKey]?.[String(fps)] ?? null;
      if (currentDepth === brushDepth) {
        onBitDepthChange(resolutionKey, fps, "");
        return;
      }
      onBitDepthChange(resolutionKey, fps, String(brushDepth));
    },
    [assignments, onBitDepthChange],
  );

  const applyCrop = useCallback(
    (resolutionKey: string, fps: number) => {
      const brush = cropBrushRef.current;
      if (brush === "CLEAR") {
        onCropChange(resolutionKey, fps, false);
        return;
      }
      if (brush == null) return;
      onCropChange(resolutionKey, fps, brush === true);
    },
    [onCropChange],
  );

  const handleCellMouseDown = useCallback(
    (resolutionKey: string, fps: number) => {
      const bitBrush = bitDepthBrushRef.current;
      const cropBrush = cropBrushRef.current;
      if (bitBrush == null && cropBrush == null) return;
      isDraggingRef.current = true;
      applyBitDepth(resolutionKey, fps);
      applyCrop(resolutionKey, fps);
    },
    [applyBitDepth, applyCrop],
  );

  const handleCellMouseEnter = useCallback(
    (resolutionKey: string, fps: number) => {
      if (!isDraggingRef.current) return;
      applyBitDepth(resolutionKey, fps);
      applyCrop(resolutionKey, fps);
    },
    [applyBitDepth, applyCrop],
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return (
    <div
      className="space-y-4 select-none"
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-muted/30 text-muted-foreground flex flex-wrap gap-4 rounded-md p-4 text-xs">
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground font-semibold tracking-wide uppercase">
            Bit depth brush
          </span>
          <div className="flex flex-wrap gap-2">
            {bitDepthOptions.map((depth) => (
              <button
                key={depth}
                type="button"
                className={cn(
                  "cursor-pointer rounded-md border border-transparent px-4 py-2 font-semibold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  bitDepthClass(depth),
                  activeBitBrush === depth &&
                    "border-primary shadow-[0_0_0_2px_rgba(59,130,246,0.8)] dark:shadow-[0_0_0_2px_rgba(59,130,246,0.6)]",
                )}
                onMouseDown={() => {
                  cropBrushRef.current = null;
                  setActiveCropBrush(null);
                  bitDepthBrushRef.current = depth;
                  setActiveBitBrush(depth);
                  console.log("[VideoBitDepthMatrix] start paint depth", depth);
                }}
              >
                {depth}-bit
              </button>
            ))}
            <button
              type="button"
              className={cn(
                "hover:bg-muted cursor-pointer rounded-md border px-4 py-2 text-xs font-semibold transition",
                activeBitBrush === "CLEAR" && "border-primary text-primary",
              )}
              onMouseDown={() => {
                console.log("[VideoBitDepthMatrix] clear depth brush");
                bitDepthBrushRef.current = "CLEAR";
                setActiveBitBrush("CLEAR");
                cropBrushRef.current = null;
                setActiveCropBrush(null);
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground font-semibold tracking-wide uppercase">
            Crop brush
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                "hover:bg-muted cursor-pointer rounded-md border px-4 py-2 text-xs font-semibold transition",
                activeCropBrush === "SET" && "border-primary text-primary",
              )}
              onMouseDown={() => {
                console.log("[VideoBitDepthMatrix] start crop paint");
                bitDepthBrushRef.current = null;
                setActiveBitBrush(null);
                cropBrushRef.current = true;
                setActiveCropBrush("SET");
              }}
            >
              Set crop
            </button>
            <button
              type="button"
              className={cn(
                "hover:bg-muted cursor-pointer rounded-md border px-4 py-2 text-xs font-semibold transition",
                activeCropBrush === "CLEAR" && "border-primary text-primary",
              )}
              onMouseDown={() => {
                console.log("[VideoBitDepthMatrix] clear crop");
                bitDepthBrushRef.current = null;
                setActiveBitBrush(null);
                cropBrushRef.current = "CLEAR";
                setActiveCropBrush("CLEAR");
              }}
            >
              Clear crop
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-auto rounded-md border">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/30 text-muted-foreground text-xs tracking-wide uppercase">
              <th className="sticky left-0 w-28 px-3 py-2 text-left font-semibold">
                FPS ↓ / Resolution →
              </th>
              {resolutions.map((resolution) => (
                <th
                  key={resolution.key}
                  className="px-3 py-2 text-left font-semibold"
                  style={{ minWidth: "6.5rem" }}
                >
                  {resolution.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fpsValues.map((fps) => (
              <tr key={fps} className="border-t">
                <td className="bg-muted text-muted-foreground sticky left-0 w-28 px-3 py-3 text-xs font-semibold whitespace-nowrap">
                  {fps} fps
                </td>
                {resolutions.map((resolution) => {
                  const bitDepth =
                    assignments[resolution.key]?.[String(fps)] ?? null;
                  const isCropped =
                    cropAssignments[resolution.key]?.[String(fps)] === true;
                  const isActive = (
                    fpsSelections[resolution.key] ?? []
                  ).includes(fps);
                  return (
                    <td
                      key={`${resolution.key}-${fps}`}
                      className="px-1 py-1 align-top"
                      style={{ minWidth: "7.5rem" }}
                    >
                      {isActive ? (
                        <div
                          className={cn(
                            "flex h-16 w-full cursor-pointer flex-col items-start justify-center rounded-md border px-2 text-left text-xs font-medium transition-colors",
                            bitDepthClass(bitDepth),
                          )}
                          onMouseDown={() =>
                            handleCellMouseDown(resolution.key, fps)
                          }
                          onMouseEnter={() =>
                            handleCellMouseEnter(resolution.key, fps)
                          }
                        >
                          <span>
                            {bitDepth != null ? `${bitDepth}-bit` : "Unset"}
                          </span>
                          {isCropped && (
                            <Crop className="mt-1 h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                      ) : (
                        <div className="text-muted-foreground flex h-16 w-full items-center justify-start rounded-md border border-dashed px-2 text-left text-xs">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
