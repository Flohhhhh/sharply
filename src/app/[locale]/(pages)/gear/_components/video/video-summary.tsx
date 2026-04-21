"use client";

import { useMemo, useState } from "react";
import type { VideoMatrixData } from "~/lib/video/transform";
import { VideoMatrixModal } from "./video-matrix-modal";
import { VideoSummaryGrid } from "./video-summary-grid";

type VideoSpecsSummaryProps = {
  summaryLines: string[];
  matrix?: VideoMatrixData;
  codecLabels?: string[];
  videoNotes?: string | null;
  enableDetailHover?: boolean;
  showDetailModal?: boolean;
  overlayLabel?: string;
};

export function VideoSpecsSummary({
  summaryLines,
  matrix,
  codecLabels = [],
  videoNotes,
  enableDetailHover = true,
  showDetailModal = true,
  overlayLabel = "View details",
}: VideoSpecsSummaryProps) {
  const [open, setOpen] = useState(false);
  const lines = useMemo(
    () => summaryLines.filter((line) => line && line.length > 0),
    [summaryLines],
  );

  if (lines.length === 0) return null;

  const canOpenModal = Boolean(showDetailModal && matrix);
  const openModal = () => {
    if (canOpenModal) setOpen(true);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canOpenModal) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal();
    }
  };
  const interactive = enableDetailHover && canOpenModal;

  return (
    <div className="text-left text-sm">
      <div
        role={canOpenModal ? "button" : undefined}
        tabIndex={canOpenModal ? 0 : -1}
        onClick={openModal}
        onKeyDown={handleKeyDown}
        className={`group relative space-y-2 rounded-md transition focus-visible:outline-none ${canOpenModal ? "cursor-pointer" : ""}`}
      >
        <VideoSummaryGrid
          lines={lines}
          className="relative z-10"
          structuredClassName={
            interactive
              ? "space-y-1 text-foreground transition group-hover:opacity-40"
              : "space-y-1 text-foreground"
          }
          plainClassName={
            interactive
              ? "space-y-1 text-foreground transition group-hover:opacity-40"
              : "space-y-1 text-foreground"
          }
        />
        {interactive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md text-xs font-bold tracking-wide uppercase opacity-0 transition group-hover:opacity-100">
            {overlayLabel}
          </div>
        )}
      </div>
      {canOpenModal && (
        <VideoMatrixModal
          open={open}
          onOpenChange={setOpen}
          matrix={matrix!}
          summaryLines={lines}
          codecLabels={codecLabels}
          videoNotes={videoNotes}
        />
      )}
    </div>
  );
}
