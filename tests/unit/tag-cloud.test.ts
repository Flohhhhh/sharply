import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TagCloud } from "~/components/gear/tag-cloud";

describe("TagCloud", () => {
  it("renders named tags", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TagCloud, {
        tags: [
          { slug: "wildlife", name: "Wildlife" },
          { slug: "compact", name: "Compact" },
        ],
      }),
    );

    expect(markup).toContain("Wildlife");
    expect(markup).toContain("Compact");
  });

  it("does not render a container when no tags are supplied", () => {
    expect(
      renderToStaticMarkup(React.createElement(TagCloud, { tags: [] })),
    ).toBe("");
  });
});
