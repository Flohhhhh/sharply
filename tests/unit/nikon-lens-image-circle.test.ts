import { describe, expect, it } from "vitest";

import { targetImageCircleSlugFromNikonLensName } from "~/lib/admin/nikon-lens-image-circle";

describe("targetImageCircleSlugFromNikonLensName", () => {
  it("assigns aps-c when DX appears as a whole token", () => {
    expect(
      targetImageCircleSlugFromNikonLensName("AF-S DX NIKKOR 35mm f/1.8G"),
    ).toBe("aps-c");
    expect(
      targetImageCircleSlugFromNikonLensName("NIKKOR Z DX 16-50mm f/3.5-6.3 VR"),
    ).toBe("aps-c");
  });

  it("matches DX case-insensitively", () => {
    expect(targetImageCircleSlugFromNikonLensName("af-s dx nikkor 18-55mm")).toBe(
      "aps-c",
    );
    expect(targetImageCircleSlugFromNikonLensName("NIKKOR Dx 40mm f/2.8G")).toBe(
      "aps-c",
    );
  });

  it("assigns full-frame when DX is absent", () => {
    expect(
      targetImageCircleSlugFromNikonLensName("NIKKOR Z 24-70mm f/2.8 S"),
    ).toBe("full-frame");
    expect(
      targetImageCircleSlugFromNikonLensName("AF-S NIKKOR 50mm f/1.8G"),
    ).toBe("full-frame");
    expect(
      targetImageCircleSlugFromNikonLensName("AF-S NIKKOR 14-24mm f/2.8G ED"),
    ).toBe("full-frame");
  });

  it("does not treat DX as a substring of another word", () => {
    expect(targetImageCircleSlugFromNikonLensName("INDEX 50mm f/1.8")).toBe(
      "full-frame",
    );
    expect(targetImageCircleSlugFromNikonLensName("NIKKOR REDX 35mm")).toBe(
      "full-frame",
    );
  });
});
