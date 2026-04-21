import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { defaultLocale,isLocale } from "~/i18n/config";
import VerifyOtpClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("verifyOtpTitle"),
    openGraph: {
      title: t("verifyOtpTitle"),
    },
  };
}

export default function VerifyOtpPage() {
  return <VerifyOtpClient />;
}
