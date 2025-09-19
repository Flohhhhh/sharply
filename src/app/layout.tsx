import "~/styles/globals.css";

import { type Metadata } from "next";
// import { Geist } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "~/components/ui/sonner";
import { FloatingCompareButton } from "~/components/compare/floating-compare-button";

export const metadata: Metadata = {
  title: {
    default: "Sharply",
    template: "%s | Sharply",
  },
  description:
    "Real specs, real reviews, real fast. Sharply is the newest and most comprehensive photography gear database and review platform featuring expert reviews, real specs, and side-by-side comparisons in a modern, minimalist interface.",
  openGraph: {
    title: "Sharply",
    description:
      "Real specs, real reviews, real fast. Sharply is the newest and most comprehensive photography gear database and review platform featuring expert reviews, real specs, and side-by-side comparisons in a modern, minimalist interface.",
    images: [{ url: "/og-image.png" }],
  },
  twitter: {
    title: "Sharply",
    description:
      "Real specs, real reviews, real fast. Sharply is the newest and most comprehensive photography gear database and review platform featuring expert reviews, real specs, and side-by-side comparisons in a modern, minimalist interface.",
    images: [{ url: "/og-image.png" }],
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // <html lang="en" className={`${geist.variable}`}>
    <html lang="en">
      <body>
        <Providers>
          {children}
          <FloatingCompareButton />
        </Providers>
        <Toaster theme="light" />
      </body>
    </html>
  );
}
