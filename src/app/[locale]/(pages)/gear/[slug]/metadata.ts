import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GetGearDisplayName } from "~/lib/gear/naming";
import { resolveRegionFromCountryCode } from "~/lib/gear/region";
import { buildGearMetaDescription } from "~/lib/seo/build-gear-meta-description";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { fetchGearBySlug,fetchStaffVerdict } from "~/server/gear/service";
import type { GearItem } from "~/types/gear";

export async function generateGearPageMetadata(params: {
  locale: string;
  slug: string;
}): Promise<Metadata> {
  const { locale, slug } = params;
  const viewerRegion = resolveRegionFromCountryCode(null);
  const t = await getTranslations({ locale, namespace: "gearDetail" });

  try {
    const item: GearItem = await fetchGearBySlug(slug);
    const verdict = await fetchStaffVerdict(slug).catch(() => null);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      throw new Error(
        "Tried to generate metadata without NEXT_PUBLIC_BASE_URL being set",
      );
    }

    const displayName = GetGearDisplayName(
      {
        name: item.name,
        regionalAliases: item.regionalAliases ?? [],
      },
      { region: viewerRegion },
    );
    const description = buildGearMetaDescription({
      gear: item,
      displayName,
      staffVerdictContent: verdict?.content ?? null,
    });
    const socialImageUrl = item.ogImageUrl ?? item.thumbnailUrl ?? null;
    const images = socialImageUrl ? [{ url: socialImageUrl }] : [];

    return buildLocalizedMetadata(`/gear/${slug}`, {
      title: `${displayName} | ${t("metaTitleSuffix")}`,
      description,
      openGraph: {
        type: "website",
        title: `${displayName} | ${t("metaTitleSuffix")}`,
        url: `${baseUrl}/gear/${slug}`,
        description,
        images,
      },
      twitter: {
        card: "summary_large_image",
        title: `${displayName} | ${t("metaTitleSuffix")}`,
        description,
        images,
      },
    });
  } catch (err: unknown) {
    if ((err as { status?: number })?.status === 404) {
      return {
        title: t("itemNotFoundTitle"),
        description: t("itemNotFoundDescription"),
        robots: { index: false, follow: false },
        openGraph: {
          title: t("itemNotFoundTitle"),
          images: [],
          description: t("itemNotFoundDescription"),
        },
      };
    }

    throw err;
  }
}
