import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LiveTrendingBadge } from "~/components/gear-badges/live-trending-badge";

describe("LiveTrendingBadge", () => {
  it("includes a stable baseline badge in server markup", () => {
    const html = renderToStaticMarkup(
      createElement(LiveTrendingBadge, {
        slug: "nikon-zf",
        initialIsTrending: true,
      }),
    );

    expect(html).toContain("Trending");
    expect(html).toContain('data-trending-status-source="baseline"');
  });

  it("emits only a visibility anchor when baseline status is false", () => {
    const html = renderToStaticMarkup(
      createElement(LiveTrendingBadge, {
        slug: "sony-a7-iv",
        initialIsTrending: false,
      }),
    );

    expect(html).not.toContain("Trending");
    expect(html).toContain('class="inline-flex size-px"');
  });

  it("renders live-source status directly from the latest server prop", () => {
    const trendingHtml = renderToStaticMarkup(
      createElement(LiveTrendingBadge, {
        slug: "nikon-zf",
        initialIsTrending: true,
        source: "live",
      }),
    );
    const fallbackHtml = renderToStaticMarkup(
      createElement(LiveTrendingBadge, {
        slug: "nikon-zf",
        initialIsTrending: false,
        source: "live",
      }),
    );

    expect(trendingHtml).toContain("Trending");
    expect(fallbackHtml).not.toContain("Trending");
    expect(fallbackHtml).toContain('data-trending-status-source="live"');
  });
});
