import { describe,expect,it } from "vitest";
import {
  parseTrustedOrigins,
  resolveAuthOriginConfig,
} from "~/server/auth/auth-origin-config";

describe("auth origin config", () => {
  it("uses the canonical site in trusted origins without pinning auth callbacks", () => {
    const result = resolveAuthOriginConfig({
      NODE_ENV: "production",
      NEXT_PUBLIC_BASE_URL: "https://www.sharplyphoto.com",
    });

    expect(result.trustedOrigins).toEqual(["https://www.sharplyphoto.com"]);
    expect(result.staticAuthBaseURL).toBeNull();
    expect(result.warning).toBeNull();
  });

  it("adds localhost and extra trusted origins without pinning auth to them", () => {
    const result = resolveAuthOriginConfig({
      NODE_ENV: "development",
      NEXT_PUBLIC_BASE_URL: "https://www.sharplyphoto.com",
      AUTH_ADDITIONAL_TRUSTED_ORIGINS:
        " https://myapp.vercel.app/path , https://myapp.vercel.app ",
    });

    expect(result.trustedOrigins).toEqual([
      "http://localhost:3000",
      "https://www.sharplyphoto.com",
      "https://myapp.vercel.app",
    ]);
    expect(result.staticAuthBaseURL).toBeNull();
  });

  it("keeps an explicit auth base override when configured", () => {
    const result = resolveAuthOriginConfig({
      NODE_ENV: "production",
      NEXT_PUBLIC_BASE_URL: "https://www.sharplyphoto.com",
      BETTER_AUTH_URL: "https://auth.sharplyphoto.com",
    });

    expect(result.staticAuthBaseURL).toBe("https://auth.sharplyphoto.com");
    expect(result.staticAuthBaseURLSource).toBe("BETTER_AUTH_URL");
  });

  it("warns when extra trusted origins coexist with a pinned auth base", () => {
    const result = resolveAuthOriginConfig({
      NODE_ENV: "production",
      NEXT_PUBLIC_BASE_URL: "https://www.sharplyphoto.com",
      AUTH_ADDITIONAL_TRUSTED_ORIGINS: "https://myapp.vercel.app",
      AUTH_BASE_URL: "https://www.sharplyphoto.com",
    });

    expect(result.warning).toContain("AUTH_ADDITIONAL_TRUSTED_ORIGINS");
    expect(result.warning).toContain("AUTH_BASE_URL");
  });
});

describe("parseTrustedOrigins", () => {
  it("normalizes, trims, and de-duplicates comma-separated origins", () => {
    expect(
      parseTrustedOrigins(
        " https://myapp.vercel.app/path, https://myapp.vercel.app , https://*.preview.example.com ",
      ),
    ).toEqual([
      "https://myapp.vercel.app",
      "https://*.preview.example.com",
    ]);
  });
});
