import { redirect } from "next/navigation";
import { defaultLocale, isLocale } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";
import { fetchRandomLowCompletionGearUrl } from "~/server/gear/service";

export const dynamic = "force-dynamic";

export default async function RandomContributionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: requestedLocale } = await params;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const destination =
    (await fetchRandomLowCompletionGearUrl()) ?? "/lists/under-construction";

  redirect(localizePathname(destination, locale));
}
