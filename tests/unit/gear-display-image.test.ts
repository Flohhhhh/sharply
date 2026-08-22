import { describe, expect, it } from "vitest";
import { getGearDisplayImageUrl } from "~/lib/gear/display-image";

describe("gear display image selection", () => {
  it("uses the lens orthographic image when no front image exists", () => {
    expect(
      getGearDisplayImageUrl({
        gearType: "LENS",
        thumbnailUrl: null,
        topViewUrl: " https://cdn.example.com/orthographic.webp ",
      }),
    ).toBe("https://cdn.example.com/orthographic.webp");
  });

  it("prefers the lens front image over the orthographic image", () => {
    expect(
      getGearDisplayImageUrl({
        gearType: "LENS",
        thumbnailUrl: "https://cdn.example.com/front.webp",
        topViewUrl: "https://cdn.example.com/orthographic.webp",
      }),
    ).toBe("https://cdn.example.com/front.webp");
  });

  it("does not use camera secondary images as a fallback", () => {
    expect(
      getGearDisplayImageUrl({
        gearType: "CAMERA",
        thumbnailUrl: null,
        topViewUrl: "https://cdn.example.com/top.webp",
      }),
    ).toBeNull();
  });
});
