import { Suspense } from "react";
import Header from "~/components/layout/header";
import Footer from "~/components/layout/footer";
import type { Metadata } from "next";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Header is a server component; suspense no longer needed for session */}
      <Header />
      {children}
      <Footer />
    </div>
  );
}
