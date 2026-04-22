import { Suspense } from "react";
import Footer from "~/components/layout/footer";
import Header from "~/components/layout/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      {children}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
