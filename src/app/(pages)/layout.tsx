import { Suspense } from "react";
import Header from "~/components/layout/header";
import Footer from "~/components/layout/footer";
import type { Metadata } from "next";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Suspense
        fallback={
          <div className="border-border bg-card border-b px-6 py-4">
            Loading...
          </div>
        }
      >
        <Header />
      </Suspense>
      {children}
      <Footer />
    </div>
  );
}
