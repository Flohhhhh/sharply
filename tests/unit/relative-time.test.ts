import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RelativeTime } from "~/components/relative-time";

describe("RelativeTime", () => {
  it("server-renders a deterministic localized date with the ISO value", () => {
    const html = renderToStaticMarkup(
      createElement(RelativeTime, {
        isoDate: "2026-03-21T10:00:00.000Z",
        locale: "en",
        style: "short",
        capitalize: true,
        justNowLabel: "just now",
      }),
    );

    expect(html).toBe(
      '<time dateTime="2026-03-21T10:00:00.000Z">Mar 21, 2026</time>',
    );
  });
});
