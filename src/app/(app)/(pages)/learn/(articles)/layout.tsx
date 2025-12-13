import LearnSidebar from "~/app/(app)/(pages)/learn/_components/learn-sidebar";
import LearnBreadcrumbs from "~/app/(app)/(pages)/learn/_components/learn-breadcrumbs";
import { TableOfContents } from "~/components/rich-text/table-of-contents";
import { getLearnPages } from "~/server/payload/service";

const sortByCreationDate = <T extends { createdAt: string }>(items: T[]) => {
  return [...items].sort(
    (firstItem, secondItem) =>
      new Date(firstItem.createdAt).getTime() -
      new Date(secondItem.createdAt).getTime(),
  );
};

export default async function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pages = await getLearnPages();
  const basicPages = pages.filter((page) => page.category === "basics");
  const unassignedPages = pages.filter(
    (page) => page.category === "unassigned",
  );

  const sections = [
    {
      title: "Basics",
      defaultOpen: true,
      items: sortByCreationDate(basicPages)
        .filter((page) => page.slug)
        .map((page) => ({
          title: page.title,
          href: `/learn/${page.slug}`,
        })),
    },
  ];

  const rootItems = sortByCreationDate(unassignedPages)
    .filter((page) => page.slug)
    .map((page) => ({
      title: page.title,
      href: `/learn/${page.slug}`,
    }));

  return (
    <div className="mx-auto min-h-screen max-w-[1500px] p-6 pt-24">
      <div className="grid gap-8 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_260px]">
        <aside>
          <LearnSidebar data={{ sections, rootItems }} />
        </aside>
        <section>
          <LearnBreadcrumbs pages={pages} />
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
