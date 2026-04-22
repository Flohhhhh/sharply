import { Suspense } from "react";
import Footer from "~/components/layout/footer";
import Header from "~/components/layout/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      {children}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}