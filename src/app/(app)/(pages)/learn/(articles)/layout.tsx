import LearnSidebar from "~/app/(app)/(pages)/learn/_components/learn-sidebar";
import LearnBreadcrumbs from "~/app/(app)/(pages)/learn/_components/learn-breadcrumbs";
import { TableOfContents } from "~/components/rich-text/table-of-contents";
import { getLearnPages } from "~/server/payload/service";

export default async function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pages = await getLearnPages();
  const basics = pages.filter((p) => p.category === "basics");
  const unassigned = pages.filter((p) => p.category === "unassigned");

  const sections = [
    {
      title: "Basics",
      defaultOpen: true,
      items: basics
        .filter((p) => p.slug)
        .map((p) => ({
          title: p.title,
          href: `/learn/${p.slug}`,
        })),
    },
  ];

  const rootItems = unassigned
    .filter((p) => p.slug)
    .map((p) => ({
      title: p.title,
      href: `/learn/${p.slug}`,
    }));

  return (
    <div className="mx-auto min-h-screen max-w-[1500px] p-6 pt-24">
      <div className="grid gap-8 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_260px]">
        <aside>
          <LearnSidebar data={{ sections, rootItems }} />
        </aside>
        <section>
          <LearnBreadcrumbs />
          <article
            id="learn-article"
            className="prose prose-h1:text-4xl prose-zinc prose-sm dark:prose-invert prose-h2:text-2xl dark:prose-h2:text-2xl sm:prose:h2:text-4xl dark:sm:prose-h2:text-4xl prose-h1:scroll-mt-8 prose-h2:scroll-mt-8 prose-h3:scroll-mt-8 prose-h4:scroll-mt-8 mx-auto max-w-none dark:opacity-90"
          >
            {children}
          </article>
        </section>
        <aside className="hidden lg:block">
          <TableOfContents contentSelector="#learn-article" />
        </aside>
      </div>
    </div>
  );
}
