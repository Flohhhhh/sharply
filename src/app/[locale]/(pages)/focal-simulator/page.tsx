import type { Metadata } from "next";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import FocalSimulatorClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalizedMetadata(
    "/focal-simulator",
    {
      title: "Focal Length Simulator",
      openGraph: {
        title: "Focal Length Simulator",
      },
    },
    locale,
  );
}

export default function Page() {
  return <FocalSimulatorClient />;
}
