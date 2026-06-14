import "~/styles/globals.css";

import type { ReactNode } from "react";
import { Archivo,Crimson_Text } from "next/font/google";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${archivo.variable} ${crimsonText.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
