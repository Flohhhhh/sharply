import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ColorwaySwatch } from "~/components/gear/colorway-swatch";

describe("ColorwaySwatch", () => {
  it("renders the diagonal split and selected interactive state", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ColorwaySwatch, {
        colorA: "#171717",
        colorB: "#FAFAFA",
        label: "Silver and black",
        interactive: true,
        selected: true,
      }),
    );

    expect(markup).toContain("linear-gradient(135deg");
    expect(markup).toContain("#171717");
    expect(markup).toContain("#FAFAFA");
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("ring-2");
  });

  it("uses a modal with one active color picker instead of a popover", () => {
    const source = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/gear/colorway-swatch-editor.tsx",
      ),
      "utf8",
    );

    expect(source).toContain("<Dialog open={open}");
    expect(source).not.toContain("PopoverContent");
    expect(source.match(/<ColorPickerPanel/g)).toHaveLength(1);
    expect(source).toContain(
      'activeSide === "a" ? labels.colorA : labels.colorB',
    );
  });
});
