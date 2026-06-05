import { notFound } from "next/navigation";
import Footer from "~/components/layout/footer";
import Header from "~/components/layout/header";
import { isLocale } from "~/i18n/config";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <div>
      <Header locale={locale} />
      {children}
      <Footer />
    </div>
  );
}
