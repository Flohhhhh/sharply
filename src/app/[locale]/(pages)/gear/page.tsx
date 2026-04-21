import { permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "browsePage" });

  return buildLocalizedMetadata("/gear", {
    title: t("legacyGearTitle"),
    openGraph: {
      title: t("legacyGearTitle"),
    },
  });
}

export default async function GearIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  permanentRedirect(localizePathname("/browse", locale as Locale));
}
