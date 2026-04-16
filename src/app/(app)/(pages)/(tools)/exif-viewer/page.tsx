import type { Metadata } from "next";
import ExifPreviewTrigger from "./_components/exif-preview-trigger";
import ExifViewerClient from "./client";

export const metadata: Metadata = {
  title: "Camera Shutter Count Tool",
  description:
    "Upload a JPG or supported RAW file to inspect EXIF and maker-note metadata and find shutter count.",
  openGraph: {
    title: "Camera Shutter Count Tool",
    description:
      "Upload a JPG or supported RAW file to inspect EXIF and maker-note metadata and find shutter count.",
  },
};

export default function ExifViewerPage() {
  const isLocalPreviewMode = process.env.NODE_ENV !== "production";

  return (
    <div className="min-h-screen">
      <div className="mx-auto mt-20 max-w-4xl space-y-8 px-4 py-8">
        <div className="mb-12 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold sm:text-4xl">
            Shutter Count & EXIF Viewer
          </h1>
          {isLocalPreviewMode ? <ExifPreviewTrigger /> : null}
        </div>
        <ExifViewerClient />
      </div>
    </div>
  );
}
