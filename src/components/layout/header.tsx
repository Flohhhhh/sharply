import { getTranslations } from "next-intl/server";
import { buildHeaderViewModel } from "~/components/layout/header-model";
import type { Locale } from "~/i18n/config";
import { getFooterItems, getNavItems } from "~/lib/nav-items";
import HeaderClient from "./header-client";

export default async function Header({ locale }: { locale: Locale }) {
  const [tCommon, tNav] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  // Keep this shared header cache-safe: request APIs like headers()/cookies()
  // would make prerendered browse and gear ISR routes dynamic again.
  const model = buildHeaderViewModel({
    locale,
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
  });

  return <HeaderClient model={model} locale={locale} />;
}
