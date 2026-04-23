import { getTranslations } from "next-intl/server";
import GearStatsClient from "~/app/[locale]/(pages)/gear/_components/gear-stats-client";
import { fetchGearStats } from "~/server/gear/service";

export default async function GearStatsCard({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) {
  const t = await getTranslations({ locale, namespace: "gearDetail" });
  const stats = await fetchGearStats(slug);
  return (
    <section>
      <div className="mb-2 text-lg font-semibold">{t("popularity")}</div>
      <GearStatsClient
        slug={slug}
        viewsToday={stats.viewsToday}
        lifetimeViews={stats.lifetimeViews}
        views30d={stats.views30d}
        wishlistTotal={stats.wishlistTotal}
        ownershipTotal={stats.ownershipTotal}
      />
    </section>
  );
}
