import { afterEach,describe,expect,it,vi } from "vitest";
import { resolveAuthClientBaseURL } from "~/lib/auth/auth-client-config";

const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

afterEach(() => {
  vi.unstubAllGlobals();
  process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
});

describe("auth client config", () => {
  it("uses the current browser origin when available", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://www.sharplyphoto.com";
    vi.stubGlobal("window", {
      location: {
        origin: "https://sharplyphoto-ten.vercel.app",
      },
    });

    expect(resolveAuthClientBaseURL()).toBe(
      "https://sharplyphoto-ten.vercel.app",
    );
  });

  it("falls back to the canonical base URL during server execution", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://www.sharplyphoto.com";

    expect(resolveAuthClientBaseURL()).toBe("https://www.sharplyphoto.com");
  });
});
