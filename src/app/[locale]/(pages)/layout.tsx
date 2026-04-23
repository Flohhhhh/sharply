import { Suspense } from "react";
import Footer from "~/components/layout/footer";
import Header from "~/components/layout/header";
import type { Locale } from "~/i18n/config";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div>
      <Suspense fallback={<div className="h-16" />}>
        <Header locale={locale as Locale} />
      </Suspense>
      {children}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
