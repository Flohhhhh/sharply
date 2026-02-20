import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getAuthCallbackUrlForOrigin } from "./callback-url";

void describe("getAuthCallbackUrlForOrigin", () => {
  void test("uses the current origin for relative callback URLs", () => {
    const result = getAuthCallbackUrlForOrigin(
      "/profile/settings",
      "https://preview.sharply.app",
    );
    assert.equal(result, "https://preview.sharply.app/profile/settings");
  });

  void test("keeps absolute callback URLs unchanged", () => {
    const result = getAuthCallbackUrlForOrigin(
      "https://sharply.app/profile/settings",
      "https://preview.sharply.app",
    );
    assert.equal(result, "https://sharply.app/profile/settings");
  });
});
