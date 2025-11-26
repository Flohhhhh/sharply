"use client";

import { useMemo, useState } from "react";
import type { VideoMatrixData } from "~/lib/video/transform";
import { VideoMatrixModal } from "./video-matrix-modal";

type VideoSpecsSummaryProps = {
  summaryLines: string[];
  matrix: VideoMatrixData;
  codecLabels: string[];
  videoNotes?: string | null;
};

export function VideoSpecsSummary({
  summaryLines,
  matrix,
  codecLabels,
  videoNotes,
}: VideoSpecsSummaryProps) {
  const [open, setOpen] = useState(false);
  const lines = useMemo(
    () => summaryLines.filter((line) => line && line.length > 0),
    [summaryLines],
  );

  const parsedLines = useMemo(
    () =>
      lines.map((line) => {
        const match = line.match(
          /^(.*?)\s+–\s+up to\s+(\d+)\s+fps\s+–\s+(\d+)-bit$/i,
        );
        if (!match) {
          return { raw: line, structured: false as const };
        }
        return {
          raw: line,
          structured: true as const,
          resolution: match[1]?.trim() ?? line,
          fps: match[2],
          bitDepth: match[3],
        };
      }),
    [lines],
  );

  const hasStructured = parsedLines.every((line) => line.structured);

  if (lines.length === 0) return null;

  const openModal = () => setOpen(true);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal();
    }
  };

  return (
    <div className="text-left text-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={openModal}
        onKeyDown={handleKeyDown}
        className="group relative cursor-pointer space-y-2 rounded-md transition focus-visible:outline-none"
      >
        {hasStructured ? (
          <div className="text-foreground space-y-1 transition group-hover:opacity-20">
            {parsedLines.map((line) =>
              line.structured ? (
                <div
                  key={line.raw}
                  className="grid grid-cols-[minmax(60px,1fr)_minmax(90px,auto)_minmax(0,auto)] items-center gap-3"
                >
                  <div className="font-semibold">{line.resolution}</div>
                  <div className="flex items-baseline gap-1 justify-self-start text-sm">
                    <span className="text-muted-foreground text-xs">up to</span>
                    <span className="font-semibold tabular-nums">
                      {line.fps}
                    </span>
                    <span className="text-muted-foreground text-xs">fps</span>
                  </div>
                  <div className="flex items-baseline gap-1 justify-self-start text-sm">
                    <span className="text-muted-foreground text-xs">up to</span>
                    <span className="font-semibold tabular-nums">
                      {line.bitDepth}
                    </span>
                    <span className="text-muted-foreground text-xs">bit</span>
                  </div>
                </div>
              ) : (
                <div key={line.raw} className="text-foreground">
                  {line.raw}
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="text-foreground space-y-1 transition group-hover:opacity-40">
            {lines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md text-xs font-bold tracking-wide uppercase opacity-0 transition group-hover:opacity-100">
          View details
        </div>
      </div>
      <VideoMatrixModal
        open={open}
        onOpenChange={setOpen}
        matrix={matrix}
        summaryLines={lines}
        codecLabels={codecLabels}
        videoNotes={videoNotes}
      />
    </div>
  );
}
