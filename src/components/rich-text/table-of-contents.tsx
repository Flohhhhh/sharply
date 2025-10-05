"use client";

import { TableOfContentsIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

function extractHeadings(container: HTMLElement | null): HeadingItem[] {
  if (!container) return [];
  const selector = "h2, h3, h4";
  const nodes = Array.from(container.querySelectorAll(selector));
  return nodes
    .map((el) => {
      const tag = el.tagName.toLowerCase();
      const level = tag === "h2" ? 2 : tag === "h3" ? 3 : 4;
      const id =
        el.id ||
        el.textContent
          ?.toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "") ||
        "";
      if (!el.id && id) el.id = id;
      return {
        id,
        text: el.textContent || "",
        level,
      };
    })
    .filter((h) => Boolean(h.id && h.text));
}

export function TableOfContents(props: {
  contentSelector?: string;
  className?: string;
}) {
  const { contentSelector = ".prose", className = "" } = props;
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const container = document.querySelector(
      contentSelector,
    ) as HTMLElement | null;
    setHeadings(extractHeadings(container));

    const headingsEls = container
      ? Array.from(container.querySelectorAll("h2, h3, h4"))
      : [];
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).offsetTop -
              (b.target as HTMLElement).offsetTop,
          );
        if (visible[0]) setActiveId((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 1] },
    );
    headingsEls.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [contentSelector]);

  const items = useMemo(() => headings, [headings]);

  if (!items.length) return null;

  return (
    <nav
      className={["text-sm", className].filter(Boolean).join(" ")}
      aria-label="Table of contents"
    >
      <div className="mb-2 flex items-center gap-2">
        <TableOfContentsIcon className="text-muted-foreground size-4" />
        <span className="text-muted-foreground">On this page</span>
      </div>

      <ul className="space-y-1">
        {items.map((h) => (
          <li
            key={h.id}
            className={h.level === 2 ? "pl-0" : h.level === 3 ? "pl-4" : "pl-8"}
          >
            <a
              href={`#${h.id}`}
              className={[
                "block truncate hover:underline",
                activeId === h.id ? "text-primary" : "text-muted-foreground",
              ].join(" ")}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
