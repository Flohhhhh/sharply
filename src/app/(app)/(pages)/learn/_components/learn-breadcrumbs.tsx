"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Breadcrumbs, type CrumbItem } from "~/components/layout/breadcrumbs";

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

export default function LearnBreadcrumbs() {
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

    const crumbs: CrumbItem[] = [];
    let hrefAccumulator = "";

    segments.forEach((seg, idx) => {
      hrefAccumulator += `/${seg}`;
      const isLast = idx === segments.length - 1;
      let label = humanizeSegment(seg);
      if (isLast && pageTitle) {
        label = pageTitle;
      }
      // Root "Learn" is linkable; intermediate are linkable; last is plain text
      crumbs.push({
        label,
        href: isLast ? undefined : hrefAccumulator,
      });
    });

    // If we're exactly on /learn, show nothing (no need for a single crumb)
    if (crumbs.length === 1) {
      return [];
    }

    return crumbs;
  }, [pathname, pageTitle]);

  if (!items.length) return null;

  return <Breadcrumbs items={items} className="mb-4" />;
}
