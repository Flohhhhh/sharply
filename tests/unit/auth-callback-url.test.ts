import { describe,expect,it } from "vitest";
import { getAuthCallbackUrlForOrigin } from "~/lib/auth/callback-url";

describe("auth callback URL resolution", () => {
  it("resolves relative callback URLs against the current origin", () => {
    expect(
      getAuthCallbackUrlForOrigin(
        "/profile/settings",
        "https://myapp.vercel.app",
      ),
    ).toBe("https://myapp.vercel.app/profile/settings");
  });

  it("rewrites canonical absolute callback URLs onto the current origin", () => {
    expect(
      getAuthCallbackUrlForOrigin(
        "https://www.sharplyphoto.com/profile/settings?linked=discord",
        "https://myapp.vercel.app",
        {
          baseOrigin: "https://www.sharplyphoto.com",
          debugLabel: "test",
        },
      ),
    ).toBe("https://myapp.vercel.app/profile/settings?linked=discord");
  });

  it("preserves absolute callback URLs that are already on another origin", () => {
    expect(
      getAuthCallbackUrlForOrigin(
        "https://accounts.example.com/return",
        "https://myapp.vercel.app",
        {
          baseOrigin: "https://www.sharplyphoto.com",
          debugLabel: "test",
        },
      ),
    ).toBe("https://accounts.example.com/return");
  });
});
