import { Dices } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LinkButton } from "~/components/ui/link-button";
import type { Locale } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";

export async function RandomContributionBanner({ locale }: { locale: Locale }) {
  const t = await getTranslations("home");

  return (
    <aside className="border-border flex flex-col gap-4 rounded-md border p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold">{t("contributionQuestTitle")}</h3>
        <p className="text-muted-foreground max-w-lg text-sm">
          {t("contributionQuestDescription")}
        </p>
      </div>
      <LinkButton
        href={localizePathname("/contribute/random", locale)}
        prefetch={false}
        className="w-full cursor-pointer bg-amber-300 text-amber-950 shadow-sm hover:bg-amber-200 dark:bg-amber-300 dark:text-amber-950 dark:hover:bg-amber-200"
        icon={<Dices aria-hidden="true" className="size-4" />}
      >
        {t("contributionQuestAction")}
      </LinkButton>
    </aside>
  );
}
