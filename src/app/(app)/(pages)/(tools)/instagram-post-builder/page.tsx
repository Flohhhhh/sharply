import type { Metadata } from "next";
import InstagramPostBuilderPage from "./client";

export const metadata: Metadata = {
  title: "Instagram Post Builder",
  description:
    "Create Instagram carousel posts with precise frame controls, guides, and export-ready slide downloads.",
  openGraph: {
    title: "Instagram Post Builder",
    description:
      "Create Instagram carousel posts with precise frame controls, guides, and export-ready slide downloads.",
  },
};

export default function Page() {
  return <InstagramPostBuilderPage />;
}
