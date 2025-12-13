"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Breadcrumbs, type CrumbItem } from "~/components/layout/breadcrumbs";
import type { LearnPage } from "~/payload-types";

function humanizeSegment(segment: string): string {
  const known: Record<string, string> = {
    learn: "Learn",
    basics: "Basics",
    "all-about-gear": "All About Gear",
  };
  if (segment in known) {
    const mapped = known[segment as keyof typeof known];
    if (mapped !== undefined) return mapped;
  }
  return segment
    .split("-")
    .map((s) => (s ? s[0]!.toUpperCase() + s.slice(1) : s))
    .join(" ");
}

type LearnBreadcrumbsProps = {
  pages: LearnPage[];
};

export default function LearnBreadcrumbs({ pages }: LearnBreadcrumbsProps) {
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState<string | null>(null);

  useEffect(() => {
    const h1 = document.querySelector<HTMLHeadingElement>("#learn-article h1");
    const text = h1?.textContent?.trim() || null;
    setPageTitle(text);
  }, [pathname]);

  const items = useMemo<CrumbItem[]>(() => {
    const segments = (pathname || "/").split("/").filter(Boolean);

    // Only show breadcrumbs for routes under /learn
    if (segments[0] !== "learn") {
      return [];
    }

    if (segments.length === 1) {
      return [];
    }

    const pageSlug = segments[segments.length - 1];
    if (!pageSlug) {
      return [];
    }
    const page = pages.find((learnPage) => learnPage.slug === pageSlug);
    const categoryLabel =
      page?.category && humanizeSegment(page.category)
        ? humanizeSegment(page.category)
        : null;

    const crumbs: CrumbItem[] = [{ label: "Learn", href: "/learn" }];

    if (categoryLabel) {
      crumbs.push({ label: categoryLabel });
    }

    const articleLabel = pageTitle || page?.title || humanizeSegment(pageSlug);

    crumbs.push({
      label: articleLabel,
    });

    return crumbs;
  }, [pathname, pageTitle, pages]);

  if (!items.length) return null;

  return <Breadcrumbs items={items} className="mb-4" />;
}
