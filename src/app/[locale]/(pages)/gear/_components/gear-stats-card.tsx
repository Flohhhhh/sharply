"use client";

import { useTranslations } from "next-intl";
import GearStatsClient from "~/app/[locale]/(pages)/gear/_components/gear-stats-client";

export default function GearStatsCard({ slug }: { slug: string }) {
  const t = useTranslations("gearDetail");
  return (
    <section>
      <div className="mb-2 text-lg font-semibold">{t("popularity")}</div>
      <GearStatsClient slug={slug} />
    </section>
  );
}
