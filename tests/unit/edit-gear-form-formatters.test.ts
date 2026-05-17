import { describe, expect, it } from "vitest";

import { formatBooleanText } from "~/app/[locale]/(pages)/gear/_components/edit-gear/edit-gear-formatters";

describe("formatBooleanText", () => {
  it("returns translated labels for boolean values", () => {
    const t = (key: string) => `common.${key}`;

    expect(formatBooleanText(true, t)).toBe("common.yes");
    expect(formatBooleanText(false, t)).toBe("common.no");
  });

  it("returns null for non-boolean values", () => {
    const t = (key: string) => `common.${key}`;

    expect(formatBooleanText(null, t)).toBeNull();
    expect(formatBooleanText("true", t)).toBeNull();
  });
});
