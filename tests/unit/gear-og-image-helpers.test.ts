import { describe,expect,it } from "vitest";
import {
  GEAR_OG_HEIGHT,
  GEAR_OG_PADDING,
  GEAR_OG_WIDTH,
  getGearOgImageDrawRect,
  shouldAutoGenerateGearOgImageOnThumbnailUpload,
} from "~/lib/gear/og-image";

describe("gear OG image helpers", () => {
  it("auto-generates on the first thumbnail upload", () => {
    expect(
      shouldAutoGenerateGearOgImageOnThumbnailUpload({
        imageType: "thumbnail",
        currentThumbnailUrl: null,
      }),
    ).toBe(true);
  });

  it("does not auto-generate when replacing an existing thumbnail", () => {
    expect(
      shouldAutoGenerateGearOgImageOnThumbnailUpload({
        imageType: "thumbnail",
        currentThumbnailUrl: "https://cdn.example.com/front.jpg",
      }),
    ).toBe(false);
  });

  it("does not auto-generate for alternate image slots", () => {
    expect(
      shouldAutoGenerateGearOgImageOnThumbnailUpload({
        imageType: "topView",
        currentThumbnailUrl: null,
      }),
    ).toBe(false);
  });

  it("fits wide images inside the padded OG canvas", () => {
    const rect = getGearOgImageDrawRect({
      sourceWidth: 2000,
      sourceHeight: 1000,
    });

    expect(rect.width).toBe(1004);
    expect(rect.height).toBe(GEAR_OG_HEIGHT - GEAR_OG_PADDING * 2);
    expect(rect.x).toBeCloseTo((GEAR_OG_WIDTH - rect.width) / 2);
    expect(rect.y).toBeCloseTo((GEAR_OG_HEIGHT - rect.height) / 2);
  });

  it("fits tall images inside the padded OG canvas", () => {
    const rect = getGearOgImageDrawRect({
      sourceWidth: 1000,
      sourceHeight: 2000,
    });

    expect(rect.height).toBe(GEAR_OG_HEIGHT - GEAR_OG_PADDING * 2);
    expect(rect.width).toBe(251);
    expect(rect.y).toBe(GEAR_OG_PADDING);
    expect(rect.x).toBeCloseTo((GEAR_OG_WIDTH - rect.width) / 2);
  });
});
