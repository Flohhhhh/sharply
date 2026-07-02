"use client";

import { Crop } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import {
  BIT_DEPTH_BUCKETS,
  bitDepthClass,
  bitDepthIconTone,
} from "~/lib/video/colors";
import type { VideoMatrixData } from "~/lib/video/transform";

type VideoMatrixModalProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  matrix: VideoMatrixData;
  codecLabels: string[];
  videoNotes?: string | null;
};

export function VideoMatrixModal({
  open,
  onOpenChange,
  matrix,
  codecLabels,
  videoNotes,
}: VideoMatrixModalProps) {
  const orderedResolutions = [...matrix.resolutions].sort((a, b) => {
    if (a.sortValue !== b.sortValue) {
      return a.sortValue - b.sortValue;
    }
    return a.label.localeCompare(b.label);
  });
  const fpsValues = matrix.fpsValues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-0 max-w-5xl sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Video Specifications</DialogTitle>
        </DialogHeader>
        <div className="min-w-0 space-y-6 text-sm">
          {/* <div className="text-muted-foreground space-y-1">
            {summaryLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div> */}

          {codecLabels.length > 0 && (
            <div className="space-y-2 rounded-md text-sm">
              <div className="text-xs tracking-wide">Available codecs</div>
              <div className="flex flex-wrap gap-2">
                {codecLabels.map((label) => (
                  <Badge key={label} variant="outline">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-full min-w-0">
            <div className="max-h-[60vh] max-w-full overflow-x-auto overflow-y-auto rounded-md border">
            <table className="w-max min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-background text-muted-foreground sticky top-0 left-0 z-30 border-r px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase shadow-[10px_0_18px_-16px_rgba(0,0,0,0.9)]">
                    FPS ↓ / Resolution →
                  </th>
                  {orderedResolutions.map((resolution) => (
                    <th
                      key={resolution.key}
                      className="bg-background text-muted-foreground sticky top-0 z-20 min-w-[140px] px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase"
                    >
                      {resolution.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fpsValues.map((fps) => (
                  <tr key={fps} className="border-t">
                    <td className="bg-background text-muted-foreground sticky left-0 z-10 border-r px-3 py-1.5 text-xs font-semibold shadow-[10px_0_18px_-16px_rgba(0,0,0,0.9)]">
                      {fps} fps
                    </td>
                    {orderedResolutions.map((resolution) => {
                      const cell = matrix.cells[resolution.key]?.[String(fps)];
                      return (
                        <td
                          key={`${resolution.key}-${fps}`}
                          className="min-w-[140px] px-2 py-2 align-top"
                        >
                          {cell ? (
                            (() => {
                              return (
                                <div
                                  className={cn(
                                    "relative flex h-12 w-full items-center justify-center rounded-md px-2 text-center text-xs font-semibold shadow",
                                    bitDepthClass(cell.bitDepth),
                                  )}
                                >
                                  <span>{cell.bitDepth}-bit</span>
                                  {cell.isCropped && (
                                    <Crop
                                      className={cn(
                                        "absolute top-1.5 right-1.5 h-3 w-3",
                                        bitDepthIconTone(cell.bitDepth),
                                      )}
                                    />
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            <div className="text-muted-foreground flex h-12 w-full items-center justify-center rounded-md border border-dashed text-xs">
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

          <div className="text-muted-foreground space-y-2 rounded-md text-xs">
            <div className="text-foreground">Legend</div>
            <div className="flex flex-wrap gap-4">
              {BIT_DEPTH_BUCKETS.map((bucket) => (
                <div key={bucket.label} className="flex items-center gap-2">
                  <span
                    className={`inline-block h-3 w-3 rounded ${bucket.className}`}
                  />
                  {bucket.label}
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Crop className="h-4 w-4" />
                Indicates cropped readout
              </div>
            </div>
          </div>

          {videoNotes && videoNotes.length > 0 && (
            <div className="rounded-md text-sm">
              <div className="text-muted-foreground mb-1 text-xs tracking-wide">
                Notes
              </div>
              <p>{videoNotes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
