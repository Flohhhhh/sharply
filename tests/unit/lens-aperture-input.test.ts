import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LensApertureInput from "~/components/custom-inputs/lens-aperture-input";

describe("LensApertureInput", () => {
  it("disables and unchecks variable aperture for a prime lens", () => {
    const markup = renderToStaticMarkup(
      createElement(LensApertureInput, {
        isPrime: true,
        maxApertureWide: 1.8,
        maxApertureTele: 2.8,
        onChange: vi.fn(),
      }),
    );

    expect(markup).toMatch(
      /role="switch"[^>]*data-state="unchecked"[^>]*disabled=""/,
    );
  });

  it("keeps variable aperture available for a zoom lens", () => {
    const markup = renderToStaticMarkup(
      createElement(LensApertureInput, {
        isPrime: false,
        maxApertureWide: 4,
        maxApertureTele: 5.6,
        onChange: vi.fn(),
      }),
    );

    expect(markup).toMatch(/role="switch"[^>]*data-state="checked"/);
    expect(markup).not.toMatch(/role="switch"[^>]*disabled=""/);
  });
});
