import { NextRequest } from "next/server";
import { describe,expect,it } from "vitest";
import { localeCookieName } from "~/i18n/config";
import { proxy } from "~/proxy";

describe("proxy", () => {
  it("internally rewrites default-locale requests without changing the visible URL", () => {
    const response = proxy(new NextRequest("http://localhost/about"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/en/about",
    );
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toContain(
      `${localeCookieName}=en`,
    );
  });

  it("redirects non-default locale cookies onto localized routes", () => {
    const request = new NextRequest("http://localhost/about", {
      headers: {
        cookie: `${localeCookieName}=ja`,
      },
    });

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/ja/about");
    expect(response.headers.get("set-cookie")).toContain(
      `${localeCookieName}=ja`,
    );
  });

  it("redirects explicit default-locale prefixes back to canonical unprefixed URLs", () => {
    const response = proxy(new NextRequest("http://localhost/en/about"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("http://localhost/about");
    expect(response.headers.get("set-cookie")).toContain(
      `${localeCookieName}=en`,
    );
  });
});
