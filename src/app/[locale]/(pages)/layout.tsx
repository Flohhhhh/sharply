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
      <Header locale={locale as Locale} />
      {children}
      <Footer />
    </div>
  );
}
