import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const nextConfigPath = path.resolve(process.cwd(), "next.config.js");
const nextConfigSource = fs.readFileSync(nextConfigPath, "utf8");

describe("next image remote patterns", () => {
  it("allows Discord CDN avatars for next/image profile rendering", () => {
    expect(nextConfigSource).toContain('hostname: "cdn.discordapp.com"');
  });

  it("keeps existing remote image hosts configured", () => {
    expect(nextConfigSource).toContain('hostname: "8v5lpkd4bi.ufs.sh"');
    expect(nextConfigSource).toContain('hostname: "utfs.io"');
    expect(nextConfigSource).toContain('hostname: "*.ytimg.com"');
    expect(nextConfigSource).toContain('hostname: "img.youtube.com"');
  });
});
