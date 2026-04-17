"use client";

import { Button } from "~/components/ui/button";

const EXIF_VIEWER_PREVIEW_EVENT = "exif-viewer:preview-loading";

export function dispatchExifViewerPreviewEvent() {
  window.dispatchEvent(new CustomEvent(EXIF_VIEWER_PREVIEW_EVENT));
}

export function getExifViewerPreviewEventName() {
  return EXIF_VIEWER_PREVIEW_EVENT;
}

export default function ExifPreviewTrigger() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={dispatchExifViewerPreviewEvent}
    >
      Preview loading
    </Button>
  );
}
