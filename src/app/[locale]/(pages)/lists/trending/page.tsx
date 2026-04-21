import { fetchTrendingPage } from "~/server/popularity/service";
import { TrendingTable } from "./_components/trending-table";
import type { Metadata } from "next";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { getTranslations } from "next-intl/server";

const DEFAULT_TIMEFRAME: "7d" | "30d" = "30d";
const DEFAULT_PER_PAGE = 20;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trendingPage" });

  return buildLocalizedMetadata("/lists/trending", {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  });
}

export default async function TrendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trendingPage" });
  const initialData = await fetchTrendingPage({
    timeframe: DEFAULT_TIMEFRAME,
    page: 1,
    perPage: DEFAULT_PER_PAGE,
  });

  return (
    <div className="mx-auto mt-10 w-full max-w-6xl px-4 py-10 sm:mt-16 sm:px-6 lg:px-0">
      <header className="mb-16 space-y-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-3xl font-bold sm:text-5xl">{t("pageTitle")}</h1>
          <p className="text-muted-foreground max-w-xl text-base">
            {t("pageDescription")}
          </p>
        </div>
      </header>
      <TrendingTable initialData={initialData} />
    </div>
  );
}
