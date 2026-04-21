import type { Metadata } from "next";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import FocalSimulatorClient from "./client";

export const metadata: Metadata = buildLocalizedMetadata("/focal-simulator", {
  title: "Focal Length Simulator",
  openGraph: {
    title: "Focal Length Simulator",
  },
});

export default function Page() {
  return <FocalSimulatorClient />;
}
