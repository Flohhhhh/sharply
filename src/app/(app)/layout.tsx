import "~/styles/globals.css";

import { type Metadata } from "next";
import { headers } from "next/headers";
// import { Geist } from "next/font/google";
import { Archivo, Crimson_Text } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "~/components/ui/sonner";
import { FloatingCompareButton } from "~/components/compare/floating-compare-button";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "Sharply",
    template: "%s | Sharply",
  },
  description:
    "Real specs, real reviews, real fast. Sharply is the newest and most comprehensive photography gear database and review platform featuring expert reviews, real specs, and side-by-side comparisons in a modern, minimalist interface.",
  openGraph: {
    siteName: "Sharply",
    title: {
      default: "Sharply",
      template: "%s | Sharply",
    },
    url: "https://www.sharplyphoto.com",
    description:
      "Real specs, real reviews, real fast. Sharply is the newest and most comprehensive photography gear database and review platform featuring expert reviews, real specs, and side-by-side comparisons in a modern, minimalist interface.",
  },
  twitter: {
    title: "Sharply",
    description:
      "Real specs, real reviews, real fast. Sharply is the newest and most comprehensive photography gear database and review platform featuring expert reviews, real specs, and side-by-side comparisons in a modern, minimalist interface.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

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
}: Readonly<{ children: React.ReactNode }>) {
  const headerList = await headers();
  const initialCountryAlpha2 =
    headerList.get("x-vercel-ip-country") ?? headerList.get("x-geo-country");

  return (
    // <html lang="en" className={`${geist.variable}`}>
    <html
      suppressHydrationWarning
      lang="en"
      className={`${archivo.variable} ${crimsonText.variable}`}
    >
      <Analytics />
      <body>
        <Providers initialCountryAlpha2={initialCountryAlpha2}>
          {children}
          <FloatingCompareButton />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
