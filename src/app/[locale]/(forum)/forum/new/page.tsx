import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { defaultLocale, isLocale } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";

export const dynamic = "force-dynamic";

export default async function NewForumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: requestedLocale } = await params;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const forumComposePath = `${localizePathname("/forum", locale)}?compose=thread`;
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    redirect(forumComposePath);
  }

  redirect(
    `${localizePathname("/auth/signin", locale)}?callbackUrl=${encodeURIComponent(forumComposePath)}`,
  );
}
