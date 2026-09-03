import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildTagSelectOptions,
  TagSelect,
} from "~/components/custom-inputs/tag-select";

describe("tag select options", () => {
  it("uses stable slugs as values and names as labels", () => {
    expect(
      buildTagSelectOptions([
        { id: "tag-1", name: "Wildlife", slug: "wildlife", icon: "Bird" },
        { id: "tag-2", name: "Travel", slug: "travel", icon: null },
      ]),
    ).toEqual([
      { id: "wildlife", name: "Wildlife" },
      { id: "travel", name: "Travel" },
    ]);
  });

  it("gives the combobox an accessible name", () => {
    const markup = renderToStaticMarkup(
      createElement(TagSelect, {
        tags: [],
        value: [],
        onChange: () => undefined,
        ariaLabel: "Tags",
      }),
    );

    expect(markup).toContain('role="combobox"');
    expect(markup).toContain('aria-label="Tags"');
  });
});
