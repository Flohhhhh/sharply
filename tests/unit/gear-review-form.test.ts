import { describe, expect, it, vi } from "vitest";

import {
  formatRetryDuration,
  type GearDetailReviewTranslator,
} from "~/app/[locale]/(pages)/gear/_components/gear-review-form.helpers";

function createTranslatorMock() {
  return vi.fn((key, values) => `${key}:${String(values?.count ?? "")}`) as
    unknown as GearDetailReviewTranslator;
}

describe("formatRetryDuration", () => {
  it("uses the seconds translation key when the retry duration is under one minute", () => {
    const translator = createTranslatorMock();

    expect(formatRetryDuration(59_000, translator)).toBe(
      "reviewRetrySeconds:59",
    );
    expect(translator).toHaveBeenCalledWith("reviewRetrySeconds", {
      count: 59,
    });
  });

  it("uses the minutes translation key when the retry duration is one minute or longer", () => {
    const translator = createTranslatorMock();

    expect(formatRetryDuration(60_000, translator)).toBe(
      "reviewRetryMinutes:1",
    );
    expect(translator).toHaveBeenCalledWith("reviewRetryMinutes", {
      count: 1,
    });
  });
});
