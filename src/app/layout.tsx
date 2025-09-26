import "~/styles/globals.css";

import { type Metadata } from "next";
// import { Geist } from "next/font/google";
import { Archivo } from "next/font/google";
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
    title: "Sharply",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // <html lang="en" className={`${geist.variable}`}>
    <html suppressHydrationWarning lang="en" className={`${archivo.variable}`}>
      <Analytics />
      <body>
        <Providers>
          {children}
          <FloatingCompareButton />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
