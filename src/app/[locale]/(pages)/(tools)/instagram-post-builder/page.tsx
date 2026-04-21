import type { Metadata } from "next";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import InstagramPostBuilderPage from "./client";

export const metadata: Metadata = buildLocalizedMetadata(
  "/instagram-post-builder",
  {
  title: "Instagram Post Builder",
  description:
    "Create Instagram carousel posts with precise frame controls, guides, and export-ready slide downloads.",
  openGraph: {
    title: "Instagram Post Builder",
    description:
      "Create Instagram carousel posts with precise frame controls, guides, and export-ready slide downloads.",
  },
  },
);

export default function Page() {
  return <InstagramPostBuilderPage />;
}
