import { describe, expect, it } from "vitest";
import { normalizeTagIconName } from "~/lib/tags/normalize-tag-icon-name";

describe("normalizeTagIconName", () => {
  it("accepts Lucide component and kebab-case names", () => {
    expect(normalizeTagIconName("Camera")).toBe("camera");
    expect(normalizeTagIconName("CircleDot")).toBe("circle-dot");
    expect(normalizeTagIconName("circle_dot")).toBe("circle-dot");
  });

  it("preserves an empty icon as undefined", () => {
    expect(normalizeTagIconName(undefined)).toBeUndefined();
  });
});
