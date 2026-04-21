import { describe,expect,it } from "vitest";
import { locales } from "~/i18n/config";
import robots from "~/app/robots";

describe("robots metadata", () => {
  it("keeps the expected base disallow entries", () => {
    const result = robots();
    const disallowEntries = Array.isArray(result.rules)
      ? []
      : Array.isArray(result.rules.disallow)
        ? result.rules.disallow
        : [result.rules.disallow ?? ""];
    const disallowedPaths = [
      "/admin/",
      "/api/",
      "/auth/",
      "/brand/",
      "/invite/",
      "/construction-test/",
      "/ui-demo/",
      "/cms/",
      "/recommended-lenses/",
      "/focal-simulator/",
      "/list/",
    ];

    for (const disallowedPath of disallowedPaths) {
      expect(disallowEntries).toContain(disallowedPath);
    }
  });

  it("keeps locale-prefixed disallow entries in sync with supported locales", () => {
    const result = robots();
    const disallowEntries = Array.isArray(result.rules)
      ? []
      : Array.isArray(result.rules.disallow)
        ? result.rules.disallow
        : [result.rules.disallow ?? ""];
    const disallowedPaths = [
      "/admin/",
      "/api/",
      "/auth/",
      "/brand/",
      "/invite/",
      "/construction-test/",
      "/ui-demo/",
      "/cms/",
      "/recommended-lenses/",
      "/focal-simulator/",
      "/list/",
    ];

    for (const locale of locales) {
      for (const disallowedPath of disallowedPaths) {
        expect(disallowEntries).toContain(`/${locale}${disallowedPath}`);
      }
    }
  });
});
