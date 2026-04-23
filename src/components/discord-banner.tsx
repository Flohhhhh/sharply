import { getTranslations } from "next-intl/server";
import { cn } from "~/lib/utils";
import DiscordLink from "./discord-link";

export default async function DiscordBanner(props: {
  locale: string;
  vertical?: boolean;
  label?: string;
  className?: string;
}) {
  const { locale, vertical = false, label, className } = props;
  const [tCommon, tFooter] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "footer" }),
  ]);
  return (
    <div
      className={cn(
        "border-border flex items-center justify-between gap-4 rounded-md border p-4",
        vertical ? "flex-col" : "flex-col sm:flex-row",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold">
          {label ?? tCommon("discordBannerTitle")}
        </h3>
        <p className="text-muted-foreground max-w-lg text-sm">
          {tCommon("discordBannerDescription")}
        </p>
      </div>
      <DiscordLink
        className={cn(vertical ? "w-full" : "w-full sm:w-fit")}
        location="discord_banner"
        label={tFooter("joinDiscord")}
      />
    </div>
  );
}
