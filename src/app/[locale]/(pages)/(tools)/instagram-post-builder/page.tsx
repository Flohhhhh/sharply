import type { Metadata } from "next";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import InstagramPostBuilderPage from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalizedMetadata(
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
    locale,
  );
}

export default function Page() {
  return <InstagramPostBuilderPage />;
}
