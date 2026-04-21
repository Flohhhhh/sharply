import type { Metadata } from "next";
import { listUnderConstruction } from "~/server/gear/service";
import { fetchGearCount } from "~/server/metrics/service";
import UnderConstructionClient from "./_components/under-construction-client";
import { BRANDS } from "~/lib/generated";
import { auth } from "~/auth";
import { headers } from "next/headers";
import { requireRole } from "~/lib/auth/auth-helpers";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { getTranslations } from "next-intl/server";
// Avoid importing runtime schema in pages; use a local constant
const GEAR_TYPES = ["CAMERA", "ANALOG_CAMERA", "LENS"] as const;

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "underConstructionPage",
  });

  return buildLocalizedMetadata("/lists/under-construction", {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "underConstructionPage",
  });
  // Include items with at least 1 missing key OR less than 40% completion overall
  // fetchGearCount is non-critical: fall back to 0 so a metrics failure never
  // breaks the whole route.
  const [items, session, totalCount] = await Promise.all([
    listUnderConstruction(1, 40),
    auth.api.getSession({ headers: await headers() }),
    fetchGearCount().catch(() => 0),
  ]);
  const underConstructionCount = items.length;
  const completedCount = Math.max(totalCount - underConstructionCount, 0);
  const completedPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="mx-auto mt-24 min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4 space-y-4">
        <h1 className="text-2xl font-semibold sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <div className="text-muted-foreground max-w-4xl space-y-2 text-sm">
          <p>{t("intro1")}</p>
          <p>{t("intro2")}</p>
        </div>
      </header>

      <UnderConstructionClient
        canToggleAutoSubmit={requireRole(session?.user, ["EDITOR"])}
        items={items}
        summary={{
          totalCount,
          underConstructionCount,
          completedCount,
          completedPercent,
        }}
        brands={BRANDS.map((b) => ({ value: b.id, label: b.name }))}
        types={GEAR_TYPES}
      />
    </div>
  );
}
