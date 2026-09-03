"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  createUniqueHeadingId,
  getActiveHeadingId,
} from "~/components/rich-text/table-of-contents-utils";
import { cn } from "~/lib/utils";

type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

const headingSelector = "h2, h3, h4";

function extractHeadings(container: HTMLElement | null): HeadingItem[] {
  if (!container) return [];

  const headings: HeadingItem[] = [];
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(headingSelector),
  );
  const usedIds = new Set(
    elements.flatMap((element) => (element.id ? [element.id] : [])),
  );

  for (const [index, element] of elements.entries()) {
    const level = Number(element.tagName.slice(1));
    const text = element.textContent?.trim() || "";

    if (!text) continue;

    const id = element.id || createUniqueHeadingId(text, index, usedIds);

    if (!element.id) element.id = id;
    headings.push({ id, text, level });
  }

  return headings;
}

function getLineWidth(level: number) {
  if (level === 2) return "w-6";
  if (level === 3) return "w-4.5";
  return "w-3";
}

function getLabelPadding(level: number) {
  if (level === 2) return "pl-2";
  if (level === 3) return "pl-4";
  return "pl-6";
}

export function TableOfContents(props: {
  contentSelector?: string;
  className?: string;
}) {
  const t = useTranslations("common");
  const { contentSelector = ".prose", className } = props;
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState("");
  const headingElementsRef = useRef<HTMLElement[]>([]);
  const frameRef = useRef<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(contentSelector);
    const nextHeadings = extractHeadings(container);
    const headingElements = container
      ? Array.from(container.querySelectorAll<HTMLElement>(headingSelector))
      : [];

    setHeadings(nextHeadings);
    headingElementsRef.current = headingElements;

    const updateActiveHeading = () => {
      frameRef.current = null;
      const elements = headingElementsRef.current;

      if (elements.length === 0) {
        setActiveId("");
        return;
      }

      const readingLine = 112;
      const isAtPageEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;
      const nextActiveId = getActiveHeadingId(
        elements.map((element) => ({
          id: element.id,
          top: element.getBoundingClientRect().top,
        })),
        readingLine,
        isAtPageEnd,
      );

      setActiveId((currentId) =>
        currentId === nextActiveId ? currentId : nextActiveId,
      );
    };

    const scheduleUpdate = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(updateActiveHeading);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [contentSelector, pathname]);

  if (!headings.length) return null;

  return (
    <nav
      className={cn(
        "group/toc relative ml-auto w-10 rounded-lg p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={t("tableOfContents")}
      tabIndex={0}
    >
      <ul aria-hidden="true" className="space-y-1">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;

          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                tabIndex={-1}
                className={cn(
                  "group/item flex h-3 items-center justify-end",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "h-0.5 shrink-0 rounded-full bg-current transition-[opacity,box-shadow] duration-150",
                    getLineWidth(heading.level),
                    isActive
                      ? "opacity-100 shadow-[0_0_6px_currentColor]"
                      : "opacity-45 group-hover/item:opacity-75",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ul>
      <div className="invisible absolute top-0 right-0 z-20 w-72 translate-x-1 opacity-0 transition-[opacity,transform,visibility] duration-150 group-hover/toc:visible group-hover/toc:translate-x-0 group-hover/toc:opacity-100 group-focus-within/toc:visible group-focus-within/toc:translate-x-0 group-focus-within/toc:opacity-100">
        <div className="border-border/60 bg-background/95 rounded-xl border p-2 shadow-lg backdrop-blur">
          <ul className="space-y-1">
            {headings.map((heading) => {
              const isActive = activeId === heading.id;

              return (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "hover:bg-accent/50 focus-visible:ring-ring block truncate rounded-md py-1.5 pr-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      getLabelPadding(heading.level),
                      isActive
                        ? "bg-accent/50 text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {heading.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
