import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const diaTextRevealMock = vi.hoisted(() =>
  vi.fn((props: { text: string | string[] }) =>
    createElement("span", { "data-testid": "dia-text-reveal" }, props.text[0]),
  ),
);

vi.mock("~/components/ui/dia-text-reveal", () => ({
  DiaTextReveal: diaTextRevealMock,
}));

import { HERO_TITLE_ROTATING_WORD_KEYS } from "~/components/home/hero-title-config";
import { HeroTitle } from "~/components/home/hero-title";

describe("HeroTitle", () => {
  it("renders a fixed two-line layout with punctuation in rotating words", () => {
    const markup = renderToStaticMarkup(
      createElement(HeroTitle, {
        line1: "Photography gear",
        line2LeadIn: "made",
        rotatingWords: ["simple.", "fast.", "easy."],
      }),
    );

    expect(markup).toContain("Photography gear");
    expect(markup).toContain("made");
    expect(markup).toContain("simple.");
    expect(markup).toMatch(/<h1\b/);
    expect(markup).toMatch(/\bblock\b/);
    expect(markup).toMatch(/items-baseline/);
  });

  it("passes rotating words to DiaTextReveal with animated width", () => {
    diaTextRevealMock.mockClear();

    renderToStaticMarkup(
      createElement(HeroTitle, {
        line1: "Photography gear",
        line2LeadIn: "made",
        rotatingWords: ["simple.", "fast.", "easy."],
      }),
    );

    expect(diaTextRevealMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: ["simple.", "fast.", "easy."],
        repeat: true,
        once: false,
        animateWidth: true,
        exitAnimation: "fade",
      }),
      undefined,
    );
  });

  it("keeps rotating word keys stable for translation lookups", () => {
    expect(HERO_TITLE_ROTATING_WORD_KEYS).toEqual(["simple", "fast", "easy"]);
  });
});
