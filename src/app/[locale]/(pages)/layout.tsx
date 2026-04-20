import { Suspense } from "react";
import Header from "~/components/layout/header";
import Footer from "~/components/layout/footer";
import type { Metadata } from "next";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Suspense
        fallback={
          <div className="bg-background fixed top-0 right-0 left-0 z-50 h-20" />
        }
      >
        <Header />
      </Suspense>
      {children}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
