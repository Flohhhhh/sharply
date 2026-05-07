import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import {
  buildHeaderInitialSearch,
  buildHeaderInitialState,
  buildHeaderViewModel,
} from "~/components/layout/header-model";
import type { Locale } from "~/i18n/config";
import { getFooterItems, getNavItems } from "~/lib/nav-items";
import HeaderClient from "./header-client";

export default async function Header({ locale }: { locale: Locale }) {
  const requestHeaders = await headers();
  const [tCommon, tNav] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  const { normalizedPathname } = buildHeaderInitialState(requestHeaders);
  const normalizedSearch = buildHeaderInitialSearch(requestHeaders);

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
