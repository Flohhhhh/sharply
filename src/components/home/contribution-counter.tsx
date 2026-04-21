import { getTranslations } from "next-intl/server";
import { fetchContributionCount } from "~/server/metrics/service";
import { ContributionCounterValue } from "./contribution-counter-value";

export async function ContributionCounter({ locale }: { locale: string }) {
  const totalContributions = await fetchContributionCount();
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div className="space-y-2">
      <ContributionCounterValue
        value={totalContributions}
        className="text-5xl font-bold"
      />
      <p className="text-muted-foreground py-0 text-sm leading-0">
        {t("contributionCounterLabel")}
      </p>
    </div>
  );
}
