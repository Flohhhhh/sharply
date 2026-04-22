import { getLocale,getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { auth } from "~/auth";
import {
  buildHeaderViewModel,
  type HeaderUser,
} from "~/components/layout/header-model";
import type { Locale } from "~/i18n/config";
import {
  normalizedPathHeaderName,
  normalizedSearchHeaderName,
} from "~/i18n/routing";
import { getFooterItems,getNavItems } from "~/lib/nav-items";
import { fetchNotificationsForUser } from "~/server/notifications/service";
import HeaderClient from "./header-client";

function mapSessionUser(
  session: Awaited<ReturnType<typeof auth.api.getSession>>,
): HeaderUser {
  return session?.user
    ? {
        id: session.user.id,
        role: session.user.role,
        handle: session.user.handle,
        memberNumber: session.user.memberNumber,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null;
}

export default async function Header() {
  const requestHeaders = await headers();
  const locale = (await getLocale()) as Locale;
  const normalizedPathname =
    requestHeaders.get(normalizedPathHeaderName)?.trim() || "/";
  const normalizedSearch =
    requestHeaders.get(normalizedSearchHeaderName)?.trim() || "";

  const sessionPromise = auth.api.getSession({
    headers: requestHeaders,
  });
  const commonTranslationsPromise = getTranslations({
    locale,
    namespace: "common",
  });
  const navTranslationsPromise = getTranslations({
    locale,
    namespace: "nav",
  });

  const [session, tCommon, tNav] = await Promise.all([
    sessionPromise,
    commonTranslationsPromise,
    navTranslationsPromise,
  ]);

  const user = mapSessionUser(session);
  const notifications = user
    ? await fetchNotificationsForUser({
        userId: user.id,
        limit: 10,
        archivedLimit: 5,
      })
    : null;

  const model = buildHeaderViewModel({
    locale,
    normalizedPathname,
    normalizedSearch,
    navItems: getNavItems(tNav),
    footerItems: getFooterItems(tNav),
    labels: {
      adminPanel: tCommon("adminPanel"),
      signIn: tCommon("signIn"),
      profile: tCommon("profile"),
      account: tCommon("account"),
      logOut: tCommon("logOut"),
      anonymous: tCommon("anonymous"),
    },
    moreLabel: tNav("more"),
    user,
    notifications,
  });

  return <HeaderClient model={model} />;
}
