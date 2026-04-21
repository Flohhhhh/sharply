"use client";

import { Search,UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleLink } from "~/components/locale-link";
import { Button } from "~/components/ui/button";
import { useSession } from "~/lib/auth/auth-client";

export function AboutCta() {
  const { data: session } = useSession();
  const t = useTranslations("aboutPage");

  if (session) {
    return (
      <Button
        asChild
        icon={<Search className="size-4" />}
        iconPosition="right"
        className="mt-4"
      >
        <LocaleLink href="/gear">{t("ctaBrowseGear")}</LocaleLink>
      </Button>
    );
  }

  return (
    <Button
      asChild
      icon={<UserPlus className="size-4" />}
      iconPosition="right"
      className="mt-4"
    >
      <LocaleLink href="/auth/signup">{t("ctaCreateAccount")}</LocaleLink>
    </Button>
  );
}
