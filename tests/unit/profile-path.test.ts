import { describe, expect, it } from "vitest";

import { buildUserProfilePath } from "~/lib/profile-path";

describe("buildUserProfilePath", () => {
  it("prefers a user's handle for their public profile path", () => {
    expect(
      buildUserProfilePath({ handle: "camera-kit", memberNumber: 42 }),
    ).toBe("/u/camera-kit");
  });

  it("falls back to the default member slug when the handle is missing", () => {
    expect(buildUserProfilePath({ handle: null, memberNumber: 42 })).toBe(
      "/u/user-42",
    );
  });

  it("returns null when the user has neither a handle nor a member number", () => {
    expect(buildUserProfilePath({ handle: "   ", memberNumber: null })).toBe(
      null,
    );
  });
});
