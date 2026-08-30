import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Footer from "~/components/layout/footer";
import Header from "~/components/layout/header";
import { getTranslations } from "next-intl/server";
import { isLocale } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";
import { fetchForumCategories } from "~/server/forum/service";

export const dynamic = "force-dynamic";

export default async function ForumLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: requestedLocale } = await params;
  if (!isLocale(requestedLocale)) notFound();

  const [categories, t] = await Promise.all([
    fetchForumCategories(),
    getTranslations({ locale: requestedLocale, namespace: "forum" }),
  ]);

  return (
    <div className="bg-background min-h-screen">
      <Header locale={requestedLocale} />
      <div className="flex h-screen min-h-0 w-full flex-col overflow-hidden pt-20">
        <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden border-r px-6 pt-12 lg:block">
            <div className="space-y-8">
              <nav aria-label={t("title")} className="space-y-1">
                <Link
                  href={localizePathname("/forum", requestedLocale)}
                  scroll={false}
                  className="bg-accent text-accent-foreground flex items-center rounded-md px-3 py-2 text-sm font-medium"
                >
                  {t("home")}
                </Link>
                <Link
                  href={`${localizePathname("/forum", requestedLocale)}?view=latest`}
                  scroll={false}
                  className="text-muted-foreground hover:bg-accent/60 hover:text-foreground flex items-center rounded-md px-3 py-2 text-sm transition-colors"
                >
                  {t("allDiscussions")}
                </Link>
              </nav>

              <div className="border-border border-t pt-6">
                {categories.length ? (
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={
                          localizePathname("/forum", requestedLocale) +
                          "?view=latest&category=" +
                          encodeURIComponent(category.slug)
                        }
                        scroll={false}
                        className="text-muted-foreground hover:bg-accent/60 hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        <ChevronRight className="size-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          {category.name}
                        </span>
                        <span className="text-muted-foreground/70 shrink-0">
                          ({category.threadCount})
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground px-3 text-sm leading-relaxed">
                    {t("noCategoriesDescription")}
                  </p>
                )}
              </div>
            </div>
          </aside>

          <main className="min-h-0 min-w-0 overflow-y-auto overscroll-contain">
            <div className="min-h-[calc(100svh-5rem)] w-full px-4 py-8 sm:px-8 lg:px-10 lg:py-12">
              {children}
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </div>
  );
}
