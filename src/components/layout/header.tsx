import { getTranslations } from "next-intl/server";
import {
  buildHeaderViewModel,
} from "~/components/layout/header-model";
import type { Locale } from "~/i18n/config";
import { getFooterItems, getNavItems } from "~/lib/nav-items";
import HeaderClient from "./header-client";

export default async function Header({ locale }: { locale: Locale }) {
  const [tCommon, tNav] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  // Path- and auth-dependent fields (initialMode, callbackUrl, signInHref,
  // user, profileHref, isAdminOrEditor, notifications) are computed
  // client-side in HeaderClient to avoid calling headers() at render time,
  // which would break ISR for gear and browse pages.
  const model = buildHeaderViewModel({
    locale,
    normalizedPathname: "/placeholder",
    normalizedSearch: "",
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
