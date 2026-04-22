import { describe, expect, it } from "vitest";
import { remoteImagePatterns } from "~/config/remote-image-patterns";

describe("remoteImagePatterns", () => {
  it("allows Discord CDN avatars for next/image profile rendering", () => {
    expect(remoteImagePatterns).toContainEqual({
      protocol: "https",
      hostname: "cdn.discordapp.com",
    });
  });

  it("keeps existing remote image hosts configured", () => {
    expect(remoteImagePatterns).toEqual(
      expect.arrayContaining([
        {
          protocol: "https",
          hostname: "8v5lpkd4bi.ufs.sh",
        },
        {
          protocol: "https",
          hostname: "utfs.io",
        },
        {
          protocol: "https",
          hostname: "*.ytimg.com",
        },
        {
          protocol: "https",
          hostname: "img.youtube.com",
        },
      ]),
    );
  });
});
