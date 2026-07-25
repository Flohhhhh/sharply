import { describe, expect, it } from "vitest";
import { shouldRevealRowActions } from "~/app/[locale]/(pages)/lists/under-construction/_components/under-construction-row-actions";

describe("under-construction row action reveal", () => {
  it("reveals actions when a touch starts on non-interactive row content", () => {
    expect(shouldRevealRowActions("touch", false)).toBe(true);
  });

  it("preserves direct name-link and action-button interactions on touch", () => {
    expect(shouldRevealRowActions("touch", true)).toBe(false);
  });

  it("leaves mouse and pen interactions to hover and focus behavior", () => {
    expect(shouldRevealRowActions("mouse", false)).toBe(false);
    expect(shouldRevealRowActions("pen", false)).toBe(false);
  });
});
