import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "~/components/ui/button";

describe("Button asChild", () => {
  it("keeps button classes and icon content on the slotted anchor", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Button,
        {
          asChild: true,
          variant: "outline",
          size: "sm",
          icon: createElement("svg", { "data-test-icon": "true" }),
        },
        createElement("a", { href: "/admin" }, "Admin Panel"),
      ),
    );

    expect(markup).toContain("<a");
    expect(markup).toContain('href="/admin"');
    expect(markup).toContain("border border-input");
    expect(markup).toContain("h-8 rounded-md px-3 text-xs");
    expect(markup).toContain('data-test-icon="true"');
    expect(markup).toContain("Admin Panel");
  });
});
