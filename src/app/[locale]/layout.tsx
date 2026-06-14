import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { BotIdClient } from "botid/client";
import { getTranslations,setRequestLocale } from "next-intl/server";
import { Toaster } from "~/components/ui/sonner";
import { isLocale,locales } from "~/i18n/config";
import { getMessagesForLocale } from "~/i18n/messages";
import { botIdProtectedRoutes } from "~/lib/security/botid-protected-routes";
import { Providers } from "./providers";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  if (!isLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL("https://www.sharplyphoto.com"),
    title: {
      default: "Sharply",
      template: "%s | Sharply",
    },
    description: t("siteDescription"),
    openGraph: {
      siteName: "Sharply",
      type: "website",
      title: {
        default: "Sharply",
        template: "%s | Sharply",
      },
      description: t("siteDescription"),
      images: [
        {
          url: "https://www.sharplyphoto.com/og-default.png",
          width: 1200,
          height: 630,
          alt: "Sharply - Photography Gear Database",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Sharply",
      description: t("siteDescription"),
      images: ["https://www.sharplyphoto.com/og-default.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: [{ rel: "icon", url: "/favicon.ico" }],
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const shouldMountAnalytics = process.env.VERCEL_ENV === "production";

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessagesForLocale(locale);

  return (
    <>
      <BotIdClient protect={botIdProtectedRoutes} />
      <Providers locale={locale} messages={messages} timeZone="UTC">
        {children}
        <Toaster />
      </Providers>
      {shouldMountAnalytics ? <Analytics /> : null}
    </>
  );
}
