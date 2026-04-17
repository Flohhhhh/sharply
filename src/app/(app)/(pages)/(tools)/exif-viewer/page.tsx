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

export default async function ExifViewerPage() {
  const isLocalPreviewMode = process.env.NODE_ENV !== "production";
  const stripeMask =
    "radial-gradient(78% 72% at 50% 4%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.72) 42%, rgba(0,0,0,0.18) 72%, transparent 100%), linear-gradient(to bottom, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.88) 46%, rgba(0,0,0,0.24) 78%, transparent 100%)";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[42rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, rgba(255,255,255,0.95) 0px, rgba(255,255,255,0.95) 1px, transparent 1px, transparent 14px)",
            maskImage: stripeMask,
            WebkitMaskImage: stripeMask,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/90 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto mt-20 max-w-4xl space-y-8 px-4 py-8">
        <div className="relative flex items-start justify-center">
          <h1 className="text-2xl font-semibold sm:text-4xl">
            Shutter Count & EXIF Viewer
          </h1>
          {isLocalPreviewMode ? (
            <div className="absolute top-0 right-0">
              <ExifPreviewTrigger />
            </div>
          ) : null}
        </div>
        <ExifViewerClient />
      </div>
    </div>
  );
}
