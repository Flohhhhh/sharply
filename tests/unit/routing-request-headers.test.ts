import { describe,expect,it } from "vitest";
import {
  applyRoutingRequestHeaders,
  localePrefixHeaderName,
  normalizedCallbackUrlHeaderName,
  normalizedPathHeaderName,
  normalizedSearchHeaderName,
} from "~/i18n/routing";

describe("routing request headers", () => {
  it("stores normalized path, search, callback, and locale prefix for localized routes", () => {
    const headers = applyRoutingRequestHeaders(new Headers(), {
      locale: "ja",
      normalizedPathname: "/about",
      normalizedSearch: "?q=sony",
    });

    expect(headers.get(localePrefixHeaderName)).toBe("/ja");
    expect(headers.get(normalizedPathHeaderName)).toBe("/about");
    expect(headers.get(normalizedSearchHeaderName)).toBe("?q=sony");
    expect(headers.get(normalizedCallbackUrlHeaderName)).toBe("/about?q=sony");
  });

  it("keeps the default locale prefix empty", () => {
    const headers = applyRoutingRequestHeaders(new Headers(), {
      locale: "en",
      normalizedPathname: "/",
      normalizedSearch: "",
    });

    expect(headers.get(localePrefixHeaderName)).toBe("");
    expect(headers.get(normalizedCallbackUrlHeaderName)).toBe("/");
  });
});
