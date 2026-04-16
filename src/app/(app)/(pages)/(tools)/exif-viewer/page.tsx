import type { Metadata } from "next";
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
  return <ExifViewerClient />;
}
