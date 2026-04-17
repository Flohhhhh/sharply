import type { Metadata } from "next";
import { ChartLine, FileLock, ScanSearch } from "lucide-react";
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
  const topGlow =
    "radial-gradient(circle at top, oklch(from var(--foreground) l c h / 0.08), transparent 70%)";
  const stripePattern =
    "repeating-linear-gradient(-45deg, oklch(from var(--foreground) l c h / 0.16) 0px, oklch(from var(--foreground) l c h / 0.16) 1px, transparent 1px, transparent 14px)";
  const featureCards = [
    {
      title: "No Image Storage Required",
      icon: FileLock,
      description: "Files are parsed then discarded immediately after extraction.",
    },
    {
      title: "100% Anonymous History Tracking",
      icon: ChartLine,
      description: "Optionally track your camera's shutter count over time privately.",
    },
    {
      title: "Smart Metadata Parsing",
      icon: ScanSearch,
      description: "Uses open source ExifTool for deeper metadata extraction.",
    },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[42rem]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: topGlow,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: stripePattern,
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

        {/* feature cards section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="flex min-h-40 flex-col items-start justify-between rounded-lg border border-border/70 bg-background/40 p-5 backdrop-blur-sm"
            >
              <card.icon className="text-muted-foreground size-8" strokeWidth={1.75} />
              <div className="space-y-2 mt-8">
                <h2 className="max-w-[16ch] text-left text-lg font-semibold leading-snug">
                  {card.title}
                </h2>
                <p className="text-muted-foreground line-clamp-2 max-w-[28ch] text-left text-sm leading-5">
                  {card.description}
                </p>
              </div>
            </article>
          ))}
        </section>

        {/* Explaination section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold sm:text-4xl mb-8 mt-12">How it works</h2>
          <p className="text-muted-foreground">
            You upload a JPG or supported RAW file, and the viewer extracts embedded EXIF and maker-note
            tags from the photo and lists them in the results. Shutter actuations appear whenever
            your camera recorded that value in the file metadata, the same way other fields do.
          </p>
          <p className="text-muted-foreground">
            Nikon, Pentax, and Sony often store release counts in maker notes alongside every image.
            Fujifilm does the same on many recent models. Bodies released before 2017 usually do not
            expose an easy count in metadata, except the X100 series, which can show it in the camera
            menu.
          </p>
          <p className="text-muted-foreground">
            Canon includes actuations in maker notes for some models, which an unedited JPG can reveal.
            On many other Canon bodies the count lives in firmware and is read with third-party apps on
            a phone or computer instead of from a photo file alone.
          </p>
          <p className="text-muted-foreground">
            Olympus, OM System, and Panasonic generally do not put shutter count in image metadata. It
            appears in hidden service-style menus, often behind model-specific button combinations.
          </p>
          <h2 className="text-2xl font-semibold sm:text-4xl mb-8 mt-12">Why shutter count matters</h2>
          <p className="text-muted-foreground">
            The number you read is usually how many times the mechanical focal-plane shutter has opened
            and closed. Each cycle adds a little wear, and over time curtains can drift out of sync or
            become unreliable at high speeds. Problems can show up gradually or in one bad cycle, and
            fixing them typically means a paid repair and time without the camera.
          </p>
          <p className="text-muted-foreground">
            The count is also a rough proxy for how hard a body has been used, which matters on the used
            market: higher actuations often mean more field time and handling, and buyers commonly weigh
            that when comparing two copies of the same model.
          </p>
          <p className="text-muted-foreground">
            Manufacturer shutter ratings are ballpark durability estimates, not guarantees. Many cameras
            never approach their rated life, but the chance of failure tends to rise as the count climbs,
            so the figure is still a practical data point when you budget for gear or plan a shoot.
          </p>
        </section>
      </div>
    </div>
  );
}
