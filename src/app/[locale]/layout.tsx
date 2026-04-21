import { type Metadata } from "next";
import { notFound } from "next/navigation";
// import { Geist } from "next/font/google";
import { Archivo, Crimson_Text } from "next/font/google";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Providers } from "./providers";
import { Toaster } from "~/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import type { Locale } from "~/i18n/config";
import { defaultLocale, isLocale, locales } from "~/i18n/config";
import { getMessagesForLocale } from "~/i18n/messages";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
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

// const geist = Geist({
//   subsets: ["latin"],
//   variable: "--font-geist-sans",
// });

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  variable: "--font-fancy",
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessagesForLocale(locale);

  return (
    // <html lang="en" className={`${geist.variable}`}>
    <html
      suppressHydrationWarning
      lang={locale}
      className={`${archivo.variable} ${crimsonText.variable}`}
    >
      <body>
        <Providers locale={locale as Locale} messages={messages} timeZone="UTC">
          {children}
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
