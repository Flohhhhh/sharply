import type { Metadata } from "next";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { ResponsiveFocalLengthClient } from "./_components/responsive-focal-length-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalizedMetadata(
    "/focal-length-reference",
    {
      title: "Field of View Reference",
      description:
        "See how different focal lengths and sensor sizes affect the field of view with different scenes.",
      openGraph: {
        title: "Field of View Reference",
        description:
          "See how different focal lengths and sensor sizes affect the field of view with different scenes.",
        images: [
          {
            url: "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTndcjXBY9t0HF8TGqsvlIEWRPn6ywJp3XzgAYQ",
            width: 1200,
            height: 630,
          },
        ],
      },
    },
    locale,
  );
}

export default function FocalLengthReferencePage() {
  return <ResponsiveFocalLengthClient />;
}
