import { describe, expect, it } from "vitest";
import {
  buildGearEditDataUrl,
  shouldRevealRowActions,
} from "~/app/[locale]/(pages)/lists/under-construction/_components/under-construction-row-actions";

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

describe("under-construction edit-data requests", () => {
  it("keeps ordinary edit requests on the stable endpoint", () => {
    expect(buildGearEditDataUrl("camera-one")).toBe(
      "/api/gear/camera-one/edit-data",
    );
  });

  it("gives image retries distinct SWR keys so stale errors are not reused", () => {
    expect(buildGearEditDataUrl("camera-one", 1)).not.toBe(
      buildGearEditDataUrl("camera-one", 2),
    );
  });
});
