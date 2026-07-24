import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UnderConstructionIndicator } from "~/components/gear/under-construction-indicator";

describe("under-construction indicator", () => {
  it("renders a neutral badge with a gray pencil-ruler icon", () => {
    const markup = renderToStaticMarkup(
      createElement(UnderConstructionIndicator, {
        variant: "badge",
        label: "Under construction",
        tooltip: "This item is under construction.",
      }),
    );

    expect(markup).toContain("Under construction");
    expect(markup).toContain("lucide-pencil-ruler");
    expect(markup).toContain("bg-muted");
    expect(markup).toContain("text-muted-foreground");
  });

  it("renders an accessible icon-only table indicator", () => {
    const markup = renderToStaticMarkup(
      createElement(UnderConstructionIndicator, {
        variant: "icon",
        label: "Under construction",
        tooltip: "This item is under construction.",
      }),
    );

    expect(markup).toContain('aria-label="This item is under construction."');
    expect(markup).toContain("lucide-pencil-ruler");
    expect(markup).not.toContain(">Under construction<");
  });
});
