import type { Metadata } from "next";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";

type TagMetadataSource = {
  name: string;
  pageTitle: string | null;
  description: string | null;
  pageContent: string | null;
};

export function resolveTagPageMetadata(
  tag: TagMetadataSource,
  fallbackDescription: string,
) {
  const title = tag.pageTitle?.trim() || tag.name.trim();
  const primaryDescription = tag.pageContent?.trim()
    ? tag.pageContent
    : tag.description;
  const description = getTagMetadataDescription(
    primaryDescription,
    fallbackDescription,
  );

  return { title, description };
}

export function buildTagPageMetadata(
  slug: string,
  tag: TagMetadataSource,
  fallbackDescription: string,
  locale: string,
): Metadata {
  const { title, description } = resolveTagPageMetadata(
    tag,
    fallbackDescription,
  );

  return buildLocalizedMetadata(
    `/tags/${slug}`,
    {
      title,
      description,
      openGraph: { title, description },
    },
    locale,
  );
}

function getTagMetadataDescription(content: string | null, fallback: string) {
  const description = content?.replace(/\s+/g, " ").trim();
  return description ? description.slice(0, 160) : fallback;
}
