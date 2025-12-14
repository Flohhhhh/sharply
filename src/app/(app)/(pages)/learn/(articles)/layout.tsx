import LearnSidebar from "~/app/(app)/(pages)/learn/_components/learn-sidebar";
import LearnBreadcrumbs from "~/app/(app)/(pages)/learn/_components/learn-breadcrumbs";
import LearnMobileArticleSheet, {
  type LearnMobileArticleGroup,
} from "~/app/(app)/(pages)/learn/_components/learn-mobile-article-sheet";
import { TableOfContents } from "~/components/rich-text/table-of-contents";
import type { LearnPage } from "~/payload-types";
import { getLearnPages } from "~/server/payload/service";

const sortByCreationDate = <T extends { createdAt: string }>(items: T[]) => {
  return [...items].sort(
    (firstItem, secondItem) =>
      new Date(firstItem.createdAt).getTime() -
      new Date(secondItem.createdAt).getTime(),
  );
};

type LearnPageWithSlug = LearnPage & { slug: string };

const humanizeCategory = (category: string) => {
  const knownCategories: Record<string, string> = {
    learn: "Learn",
    basics: "Basics",
    unassigned: "Unassigned",
    "all-about-gear": "All About Gear",
  };
  const mappedCategory = knownCategories[category];
  if (mappedCategory) {
    return mappedCategory;
  }
  return category
    .split("-")
    .map((segment) => {
      if (!segment) {
        return segment;
      }
      const segmentFirstCharacter = segment.charAt(0);
      const restOfSegment = segment.slice(1);
      return `${segmentFirstCharacter.toUpperCase()}${restOfSegment}`;
    })
    .join(" ");
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

  const availablePages = pages.filter((page): page is LearnPageWithSlug =>
    Boolean(page.slug),
  );
  const pagesByCategory = availablePages.reduce<
    Record<string, LearnPageWithSlug[]>
  >((accumulator, page) => {
    const category = page.category || "unassigned";
    if (!accumulator[category]) {
      accumulator[category] = [];
    }
    accumulator[category].push(page);
    return accumulator;
  }, {});

  const preferredCategoryOrder = ["basics", "unassigned"];
  const orderedCategoryNames = [
    ...preferredCategoryOrder.filter((name) => pagesByCategory[name]),
    ...Object.keys(pagesByCategory)
      .filter((name) => !preferredCategoryOrder.includes(name))
      .sort((first, second) => first.localeCompare(second)),
  ];

  const mobileGroups = orderedCategoryNames
    .map((category) => {
      const categoryPages = pagesByCategory[category];
      if (!categoryPages?.length) {
        return null;
      }
      return {
        title: humanizeCategory(category),
        items: sortByCreationDate(categoryPages).map((page) => ({
          title: page.title,
          href: `/learn/${page.slug}`,
        })),
      };
    })
    .filter((group): group is LearnMobileArticleGroup => Boolean(group));

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
    <>
      <LearnMobileArticleSheet groups={mobileGroups} />
      <div className="mx-auto min-h-screen max-w-[1250px] p-6 pt-12 sm:pt-24">
        <div className="grid gap-8 md:grid-cols-[280px_1fr] lg:grid-cols-[240px_1fr_260px]">
          <aside className="hidden lg:block">
            <LearnSidebar data={{ sections, rootItems }} />
          </aside>
          <section className="sm:mr-4">
            <LearnBreadcrumbs pages={pages} />
            <article
              id="learn-article"
              className="prose-img:rounded-md prose-h3:scroll-mt-20 prose-h2:mt-12 prose prose-h1:text-4xl prose-zinc dark:prose-invert prose-h2:text-2xl dark:prose-h2:text-2xl sm:prose:h2:text-4xl dark:sm:prose-h2:text-4xl prose-h1:scroll-mt-20 prose-h2:scroll-mt-20 prose-h4:scroll-mt-20 mx-auto max-w-none dark:opacity-90"
            >
              {children}
            </article>
          </section>
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <TableOfContents contentSelector="#learn-article" />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
