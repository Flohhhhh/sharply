import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import {
  buildHeaderViewModel,
} from "~/components/layout/header-model";
import type { Locale } from "~/i18n/config";
import {
  normalizedPathHeaderName,
  normalizedSearchHeaderName,
} from "~/i18n/routing";
import { getFooterItems, getNavItems } from "~/lib/nav-items";
import HeaderClient from "./header-client";

export default async function Header({ locale }: { locale: Locale }) {
  const requestHeaders = await headers();
  const [tCommon, tNav] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  const normalizedPathname =
    requestHeaders.get(normalizedPathHeaderName) ?? "/";
  const normalizedSearch = requestHeaders.get(normalizedSearchHeaderName) ?? "";

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
    user: null,
    notifications: null,
  });

  return <HeaderClient model={model} locale={locale} />;
}
