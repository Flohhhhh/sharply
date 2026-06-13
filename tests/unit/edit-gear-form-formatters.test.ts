import { describe, expect, it } from "vitest";

import { formatBooleanText } from "~/app/[locale]/(pages)/gear/_components/edit-gear/edit-gear-formatters";

describe("formatBooleanText", () => {
  it("returns translated labels for boolean values", () => {
    const labels = { yes: "Oui", no: "Non" };

    expect(formatBooleanText(true, labels)).toBe("Oui");
    expect(formatBooleanText(false, labels)).toBe("Non");
  });

  it("returns null for non-boolean values", () => {
    const labels = { yes: "Ja", no: "Nein" };

    expect(formatBooleanText(null, labels)).toBeNull();
    expect(formatBooleanText("true", labels)).toBeNull();
  });
});
