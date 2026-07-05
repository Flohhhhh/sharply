import { createElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const linkStatusMocks = vi.hoisted(() => ({
  pending: false,
  useLinkStatus: vi.fn(() => ({
    pending: linkStatusMocks.pending,
  })),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: ComponentProps<"a"> & { children?: ReactNode }) =>
    createElement("a", props, children),
  useLinkStatus: linkStatusMocks.useLinkStatus,
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    priority: _priority,
    src,
    ...props
  }: ComponentProps<"img"> & { priority?: boolean; src: string }) =>
    createElement("img", { ...props, alt, src }),
}));

import { NewsCard, type NewsCardSize } from "~/components/home/news-card";

function renderNewsCard({
  pending,
  size,
}: {
  pending: boolean;
  size: NewsCardSize;
}) {
  linkStatusMocks.pending = pending;

  return renderToStaticMarkup(
    createElement(NewsCard, {
      size,
      badge: size === "lg" ? "Featured" : undefined,
      imagePriority: size === "lg",
      post: {
        id: "post-1",
        title: "Canon teases next-gen RF lens roadmap",
        excerpt: "A sneak peek at upcoming fast primes and zooms.",
        href: "/news/canon-rf-roadmap",
        image: "/image-temp.png",
        date: "July 5, 2026",
        readMinutes: 6,
      },
    }),
  );
}

describe("homepage news card navigation pending state", () => {
  it.each(["lg", "md"] as const)(
    "renders the %s homepage news card without pending UI by default",
    (size) => {
      const markup = renderNewsCard({ pending: false, size });

      expect(markup).toContain('data-home-news-card-pending="false"');
      expect(markup).toContain('data-home-news-card-content-pending="false"');
      expect(markup).not.toContain(
        'data-home-news-card-pending-overlay="true"',
      );
    },
  );

  it.each(["lg", "md"] as const)(
    "renders the %s homepage news card with overlay while pending",
    (size) => {
      const markup = renderNewsCard({ pending: true, size });

      expect(markup).toContain('data-home-news-card-pending="true"');
      expect(markup).toContain('data-home-news-card-content-pending="true"');
      expect(markup).toContain(
        'data-home-news-card-pending-overlay="true"',
      );
    },
  );
});
