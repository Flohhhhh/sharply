import type { Metadata } from "next";
import FocalSimulatorClient from "./client";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";

export const metadata: Metadata = buildLocalizedMetadata("/focal-simulator", {
  title: "Focal Length Simulator",
  openGraph: {
    title: "Focal Length Simulator",
  },
});

export default function Page() {
  return <FocalSimulatorClient />;
}
