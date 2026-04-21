import { getTranslations } from "next-intl/server";
import { fetchGearCount } from "~/server/metrics/service";
import { GearCounterValue } from "./gear-counter-value";

export async function GearCounter({ locale }: { locale: string }) {
  const totalGearItems = await fetchGearCount();
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div className="space-y-2">
      <GearCounterValue value={totalGearItems} className="text-5xl font-bold" />
      <p className="text-muted-foreground py-0 text-sm leading-0">
        {t("gearCounterLabel")}
      </p>
    </div>
  );
}
