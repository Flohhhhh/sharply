import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import {
  BaseIsoInput,
  MAX_BASE_ISO_ENTRIES,
} from "~/app/[locale]/(pages)/gear/_components/edit-gear/base-iso-input";

const labels = {
  label: "Base ISO",
  addLabel: "Add base ISO",
  removeLabel: "Remove base ISO",
  helpText: "Add up to 3 native base ISO values.",
  invalidMessage: "Enter a positive whole number.",
};

function render(value: number[] | null) {
  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, {
      locale: "en",
      messages: {},
      children: createElement(BaseIsoInput, {
        value,
        onChange: () => {},
        ...labels,
      }),
    }),
  );
}

describe("BaseIsoInput", () => {
  it("renders the existing ISO option selector and localized controls", () => {
    const markup = render([800]);

    expect(markup).toContain("Base ISO 1");
    expect(markup).toContain("rounded-md border p-3");
    expect(markup).toContain('role="combobox"');
    expect(markup).toContain("required");
    expect(markup).toContain("Add base ISO");
    expect(markup).toContain("Remove base ISO 1");
  });

  it("disables adding at the configured three-row cap", () => {
    expect(MAX_BASE_ISO_ENTRIES).toBe(3);
    expect(render([800, 4000, 12800])).toMatch(
      /<button[^>]*disabled=""[^>]*>.*Add base ISO/s,
    );
  });

  it("renders no numbered labels when the value is cleared", () => {
    const markup = render(null);

    expect(markup).not.toContain("Base ISO 1");
    expect(markup).toContain("Add base ISO");
  });
});
