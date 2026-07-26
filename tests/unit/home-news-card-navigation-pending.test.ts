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
    fill: _fill,
    priority: _priority,
    src,
    ...props
  }: ComponentProps<"img"> & {
    fill?: boolean;
    priority?: boolean;
    src: string;
  }) =>
    createElement("img", { ...props, alt, src }),
}));

import { NewsCard, type NewsCardSize } from "~/components/home/news-card";

const HOMEPAGE_NEWS_IMAGE_SIZES =
  "(min-width: 1280px) 840px, (min-width: 768px) calc(60vw - 48px), (min-width: 640px) calc(100vw - 72px), calc(100vw - 56px)";
const RELATED_NEWS_IMAGE_SIZES =
  "(min-width: 768px) calc(33vw - 24px), (min-width: 640px) calc(50vw - 30px), calc(100vw - 48px)";

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

  it.each(["lg", "md"] as const)(
    "uses a responsive full-width image hint for the %s homepage card",
    (size) => {
      const markup = renderNewsCard({ pending: false, size });

      expect(markup).toContain(`sizes="${HOMEPAGE_NEWS_IMAGE_SIZES}"`);
      expect(markup).not.toContain('width="720"');
    },
  );

  it("uses a smaller responsive image hint for related-news cards", () => {
    const markup = renderNewsCard({ pending: false, size: "sm" });

    expect(markup).toContain(`sizes="${RELATED_NEWS_IMAGE_SIZES}"`);
    expect(markup).not.toContain(`sizes="${HOMEPAGE_NEWS_IMAGE_SIZES}"`);
  });
});
