import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { FpsPerShutterInput } from "~/app/[locale]/(pages)/gear/_components/edit-gear/fields-cameras";

describe("FpsPerShutterInput", () => {
  it("does not report changes while rendering existing values", () => {
    const onChange = vi.fn();
    const onHeadlineChange = vi.fn();

    const markup = renderToStaticMarkup(
      createElement(FpsPerShutterInput, {
        availableShutterTypes: ["mechanical", "efc", "electronic"],
        value: {
          mechanical: { raw: "14.0", jpg: "14.0" },
          efc: { raw: "14.0", jpg: "14.0" },
          electronic: { raw: "20.0", jpg: "120.0" },
        },
        onChange,
        onHeadlineChange,
        isVisible: true,
        getLabel: (value) => value,
        tf: (_key, fallback) => fallback,
      }),
    );

    expect(markup).toContain("mechanical");
    expect(markup).toContain("electronic");
    expect(onChange).not.toHaveBeenCalled();
    expect(onHeadlineChange).not.toHaveBeenCalled();
  });
});
